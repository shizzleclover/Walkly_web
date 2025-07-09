// Route Generation Library - Google Maps Version
// Migrated from Mapbox to Google Maps Directions API

export interface RouteGenerationOptions {
  startLocation: {
    lat: number;
    lng: number;
  };
  duration?: number; // in minutes, default 30
  preferredDistance?: number; // in kilometers, overrides duration if provided
  complexity?: 'simple' | 'medium' | 'complex'; // number of waypoints
  avoidHighways?: boolean;
  avoidTolls?: boolean;
}

export interface GeneratedRoute {
  coordinates: google.maps.LatLng[];
  distance: number; // in meters
  duration: number; // in seconds
  waypoints: google.maps.LatLng[];
  instructions?: string[];
  bounds?: google.maps.LatLngBounds;
}

export interface RouteGenerationResult {
  success: boolean;
  route?: GeneratedRoute;
  error?: string;
}

// Initialize Google Maps services
let directionsService: google.maps.DirectionsService | null = null;

const initializeGoogleMapsServices = () => {
  if (typeof google !== 'undefined' && google.maps) {
    if (!directionsService) {
      directionsService = new google.maps.DirectionsService();
    }
    return true;
  }
  return false;
};

export async function generateWalkingRoute(
  options: RouteGenerationOptions
): Promise<RouteGenerationResult> {
  try {
    // Check if Google Maps is loaded
    if (!initializeGoogleMapsServices()) {
      throw new Error('Google Maps API not loaded');
    }

    const {
      startLocation,
      duration = 30,
      preferredDistance,
      complexity = 'medium',
      avoidHighways = true,
      avoidTolls = true
    } = options;

    // Calculate target distance if not provided
    const targetDistance = preferredDistance || estimateWalkDistance(duration);
    
    // Generate waypoints for a circular route
    const waypoints = generateCircularWaypoints(
      startLocation,
      targetDistance / 2, // radius
      complexity
    );

    // Create the route request
    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(startLocation.lat, startLocation.lng),
      destination: new google.maps.LatLng(startLocation.lat, startLocation.lng), // Return to start
      waypoints: waypoints.map(point => ({
        location: new google.maps.LatLng(point.lat, point.lng),
        stopover: false
      })),
      travelMode: google.maps.TravelMode.WALKING,
      avoidHighways,
      avoidTolls,
      optimizeWaypoints: true,
    };

    return new Promise((resolve) => {
      directionsService!.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          const route = result.routes[0];
          const leg = route.legs[0];
          
          // Extract coordinates from the route
          const coordinates: google.maps.LatLng[] = [];
          route.legs.forEach(leg => {
            leg.steps.forEach(step => {
              step.path.forEach(point => {
                coordinates.push(point);
              });
            });
          });

          // Extract waypoints
          const extractedWaypoints = waypoints.map(wp => 
            new google.maps.LatLng(wp.lat, wp.lng)
          );

          // Extract instructions
          const instructions: string[] = [];
          route.legs.forEach(leg => {
            leg.steps.forEach(step => {
              instructions.push(step.instructions);
            });
          });

          const generatedRoute: GeneratedRoute = {
            coordinates,
            distance: leg.distance?.value || 0,
            duration: leg.duration?.value || 0,
            waypoints: extractedWaypoints,
            instructions,
            bounds: route.bounds
          };

          resolve({
            success: true,
            route: generatedRoute
          });
        } else {
          let errorMessage = 'Failed to generate route';
          switch (status) {
            case google.maps.DirectionsStatus.NOT_FOUND:
              errorMessage = 'Location not found';
              break;
            case google.maps.DirectionsStatus.ZERO_RESULTS:
              errorMessage = 'No route found between the specified points';
              break;
            case google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED:
              errorMessage = 'Too many waypoints specified';
              break;
            case google.maps.DirectionsStatus.INVALID_REQUEST:
              errorMessage = 'Invalid route request';
              break;
            case google.maps.DirectionsStatus.OVER_QUERY_LIMIT:
              errorMessage = 'API quota exceeded';
              break;
            case google.maps.DirectionsStatus.REQUEST_DENIED:
              errorMessage = 'Directions API access denied';
              break;
            case google.maps.DirectionsStatus.UNKNOWN_ERROR:
              errorMessage = 'Unknown error occurred';
              break;
          }

          resolve({
            success: false,
            error: errorMessage
          });
        }
      });
    });

  } catch (error) {
    console.error('Route generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

function generateCircularWaypoints(
  center: { lat: number; lng: number },
  radiusKm: number,
  complexity: 'simple' | 'medium' | 'complex'
): { lat: number; lng: number }[] {
  const waypointCounts = {
    simple: 2,
    medium: 4,
    complex: 6
  };

  const numWaypoints = waypointCounts[complexity];
  const waypoints: { lat: number; lng: number }[] = [];

  // Earth's radius in kilometers
  const earthRadiusKm = 6371;

  // Convert radius from km to degrees (approximate)
  const radiusDegrees = radiusKm / earthRadiusKm * (180 / Math.PI);

  for (let i = 0; i < numWaypoints; i++) {
    // Calculate angle for this waypoint (evenly spaced around the circle)
    const angle = (2 * Math.PI * i) / numWaypoints;
    
    // Add some randomness to make routes more interesting
    const randomFactor = 0.3 + Math.random() * 0.4; // Between 0.3 and 0.7
    const actualRadius = radiusDegrees * randomFactor;
    
    // Calculate waypoint coordinates
    const lat = center.lat + actualRadius * Math.cos(angle);
    const lng = center.lng + actualRadius * Math.sin(angle) / Math.cos(center.lat * Math.PI / 180);

    waypoints.push({ lat, lng });
  }

  return waypoints;
}

export function estimateWalkDuration(distanceKm: number, speedKmh: number = 5): number {
  // Returns duration in minutes
  return Math.round((distanceKm / speedKmh) * 60);
}

export function estimateWalkDistance(durationMinutes: number, speedKmh: number = 5): number {
  // Returns distance in kilometers
  return (durationMinutes / 60) * speedKmh;
}

export async function generateAlternativeRoutes(
  options: RouteGenerationOptions,
  count: number = 3
): Promise<RouteGenerationResult[]> {
  const routes: RouteGenerationResult[] = [];
  
  for (let i = 0; i < count; i++) {
    // Vary the complexity and add some randomness for alternative routes
    const complexities: ('simple' | 'medium' | 'complex')[] = ['simple', 'medium', 'complex'];
    const altOptions = {
      ...options,
      complexity: complexities[i % complexities.length]
    };
    
    const route = await generateWalkingRoute(altOptions);
    routes.push(route);
    
    // Add a small delay between requests to avoid rate limiting
    if (i < count - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return routes;
}

// Helper function to convert Google Maps LatLng to a simple coordinate object
export function latLngToCoords(latLng: google.maps.LatLng): { lat: number; lng: number } {
  return {
    lat: latLng.lat(),
    lng: latLng.lng()
  };
}

// Helper function to convert coordinates to Google Maps LatLng
export function coordsToLatLng(coords: { lat: number; lng: number }): google.maps.LatLng {
  return new google.maps.LatLng(coords.lat, coords.lng);
} 