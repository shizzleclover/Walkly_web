import mapboxgl from "mapbox-gl";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
const MAPBOX_DIRECTIONS_API = "https://api.mapbox.com/directions/v5/mapbox/walking";

export interface RouteGenerationOptions {
  startLocation: {
    lat: number;
    lng: number;
  };
  duration?: number; // in minutes, default 30
  preferredDistance?: number; // in kilometers, overrides duration if provided
  complexity?: 'simple' | 'medium' | 'complex'; // number of waypoints
}

export interface GeneratedRoute {
  coordinates: mapboxgl.LngLatLike[];
  distance: number; // in meters
  duration: number; // in seconds
  waypoints: mapboxgl.LngLatLike[];
  instructions?: string[];
}

export interface RouteGenerationResult {
  success: boolean;
  route?: GeneratedRoute;
  error?: string;
}

/**
 * Generates a circular walking route starting and ending at the user's location
 */
export async function generateWalkingRoute(
  options: RouteGenerationOptions
): Promise<RouteGenerationResult> {
  if (!MAPBOX_TOKEN) {
    return {
      success: false,
      error: "Mapbox token not found. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your environment variables."
    };
  }

  // Check network connectivity
  if (!navigator.onLine) {
    return {
      success: false,
      error: "No internet connection. Please check your network and try again."
    };
  }

  try {
    const { startLocation, duration = 30, preferredDistance, complexity = 'medium' } = options;

    // Calculate radius based on duration or distance
    const walkingSpeedKmh = 5; // Average walking speed
    const radiusKm = preferredDistance 
      ? preferredDistance / 4 // Quarter of total distance for radius to account for circular route
      : (duration / 60) * walkingSpeedKmh / 4;

    // Generate waypoints around the start location
    const waypoints = generateCircularWaypoints(startLocation, radiusKm, complexity);
    
    // Create the full route: start -> waypoints -> start
    const fullWaypoints = [
      [startLocation.lng, startLocation.lat],
      ...waypoints,
      [startLocation.lng, startLocation.lat]
    ];

    // Call Mapbox Directions API with timeout and enhanced error handling
    const directionsUrl = buildDirectionsUrl(fullWaypoints);
    console.log('Requesting route from:', directionsUrl);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(directionsUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Walkly/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      let errorMessage = `Directions API error: ${response.status} ${response.statusText}`;
      
      if (response.status === 401) {
        errorMessage = "Invalid Mapbox access token. Please check your configuration.";
      } else if (response.status === 403) {
        errorMessage = "Mapbox API access denied. Please check your token permissions.";
      } else if (response.status === 422) {
        errorMessage = "Invalid route parameters. Please try a different location.";
      } else if (response.status >= 500) {
        errorMessage = "Mapbox service temporarily unavailable. Please try again later.";
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return {
        success: false,
        error: "No route found for this location. Try adjusting the distance or choosing a different area."
      };
    }

    const route = data.routes[0];
    const coordinates = decodePolyline(route.geometry);

    if (coordinates.length === 0) {
      return {
        success: false,
        error: "Route coordinates could not be processed. Please try again."
      };
    }

    return {
      success: true,
      route: {
        coordinates,
        distance: route.distance,
        duration: route.duration,
        waypoints: fullWaypoints,
        instructions: route.legs?.flatMap((leg: any) => 
          leg.steps?.map((step: any) => step.maneuver?.instruction) || []
        ).filter(Boolean)
      }
    };

  } catch (error) {
    console.error('Route generation error:', error);
    
    let userFriendlyError = "Failed to generate route";
    
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (error.name === 'AbortError' || errorMessage.includes('timeout')) {
        userFriendlyError = "Request timed out. Please check your connection and try again.";
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        userFriendlyError = "Network error. Please check your internet connection.";
      } else if (errorMessage.includes('token') || errorMessage.includes('unauthorized')) {
        userFriendlyError = "Map service authentication error. Please try again later.";
      } else if (errorMessage.includes('connection reset') || errorMessage.includes('connection refused')) {
        userFriendlyError = "Cannot connect to map services. Please check your network or try again later.";
      } else {
        userFriendlyError = error.message;
      }
    }
    
    return {
      success: false,
      error: userFriendlyError
    };
  }
}

/**
 * Generates waypoints in a roughly circular pattern around the start location
 */
function generateCircularWaypoints(
  center: { lat: number; lng: number },
  radiusKm: number,
  complexity: 'simple' | 'medium' | 'complex'
): mapboxgl.LngLatLike[] {
  const numWaypoints = {
    simple: 2,
    medium: 3,
    complex: 4
  }[complexity];

  const waypoints: mapboxgl.LngLatLike[] = [];
  
  // Convert radius to degrees (approximate)
  const radiusLat = radiusKm / 111.32; // 1 degree latitude ≈ 111.32 km
  const radiusLng = radiusKm / (111.32 * Math.cos(center.lat * Math.PI / 180));

  for (let i = 0; i < numWaypoints; i++) {
    // Calculate angle for this waypoint (evenly distributed around circle)
    const angle = (2 * Math.PI * i) / numWaypoints;
    
    // Add some randomness to make the route more interesting
    const randomRadius = radiusKm * (0.7 + Math.random() * 0.6); // 70% to 130% of base radius
    const randomAngle = angle + (Math.random() - 0.5) * 0.5; // ±0.25 radians variation
    
    // Convert back to lat/lng with randomness
    const randomRadiusLat = randomRadius / 111.32;
    const randomRadiusLng = randomRadius / (111.32 * Math.cos(center.lat * Math.PI / 180));
    
    const lat = center.lat + randomRadiusLat * Math.sin(randomAngle);
    const lng = center.lng + randomRadiusLng * Math.cos(randomAngle);
    
    waypoints.push([lng, lat]);
  }

  return waypoints;
}

/**
 * Builds the Mapbox Directions API URL
 */
function buildDirectionsUrl(waypoints: mapboxgl.LngLatLike[]): string {
  const coordinates = waypoints
    .map(point => `${Array.isArray(point) ? point[0] : point.lng},${Array.isArray(point) ? point[1] : point.lat}`)
    .join(';');

  const params = new URLSearchParams({
    geometries: 'geojson',
    overview: 'full',
    steps: 'true',
    access_token: MAPBOX_TOKEN!
  });

  return `${MAPBOX_DIRECTIONS_API}/${coordinates}?${params.toString()}`;
}

/**
 * Decodes the geometry from Mapbox Directions API response
 */
function decodePolyline(geometry: any): mapboxgl.LngLatLike[] {
  if (geometry.type === 'LineString') {
    return geometry.coordinates;
  }
  
  // If it's an encoded polyline string, we'd need to decode it
  // For now, assume it's already GeoJSON
  return [];
}

/**
 * Calculates the estimated duration for a given distance
 */
export function estimateWalkDuration(distanceKm: number, speedKmh: number = 5): number {
  return Math.round((distanceKm / speedKmh) * 60); // Return minutes
}

/**
 * Calculates the estimated distance for a given duration
 */
export function estimateWalkDistance(durationMinutes: number, speedKmh: number = 5): number {
  return (durationMinutes / 60) * speedKmh; // Return kilometers
}

/**
 * Generates alternative routes by varying waypoints
 */
export async function generateAlternativeRoutes(
  options: RouteGenerationOptions,
  count: number = 3
): Promise<RouteGenerationResult[]> {
  const promises = Array.from({ length: count }, (_, i) => {
    // Vary complexity and add randomization seed
    const complexity: Array<'simple' | 'medium' | 'complex'> = ['simple', 'medium', 'complex'];
    return generateWalkingRoute({
      ...options,
      complexity: complexity[i % complexity.length]
    });
  });

  return Promise.all(promises);
} 