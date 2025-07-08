"use client";

import * as React from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Button } from "@/components/ui/button";
import { AlertCircle, Navigation, Plus, Minus, Target, Camera, RefreshCw, Wifi, WifiOff } from "lucide-react";

// Mapbox token should be in environment variables
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

export interface WalklyMapProps {
  onLocationUpdate?: (coords: GeolocationCoordinates) => void;
  onMomentPin?: (location: { lat: number; lng: number }) => void;
  walkState: 'idle' | 'generating' | 'preview' | 'active' | 'paused' | 'completed';
  isTracking?: boolean;
  generatedRoute?: mapboxgl.LngLatLike[];
  breadcrumbTrail?: mapboxgl.LngLatLike[];
  moments?: Array<{ id: string; lat: number; lng: number; photo_url?: string; description?: string }>;
  className?: string;
}

interface UserLocation {
  coords: GeolocationCoordinates;
  timestamp: number;
}

interface ConnectivityStatus {
  isOnline: boolean;
  mapboxReachable: boolean;
  lastChecked: number;
}

export function WalklyMap({
  onLocationUpdate,
  onMomentPin,
  walkState,
  isTracking = false,
  generatedRoute = [],
  breadcrumbTrail = [],
  moments = [],
  className = ""
}: WalklyMapProps) {
  const mapContainer = React.useRef<HTMLDivElement>(null);
  const map = React.useRef<mapboxgl.Map | null>(null);
  const userMarker = React.useRef<mapboxgl.Marker | null>(null);
  const [userLocation, setUserLocation] = React.useState<UserLocation | null>(null);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = React.useState(false);
  const [mapError, setMapError] = React.useState<string | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);
  const [connectivity, setConnectivity] = React.useState<ConnectivityStatus>({
    isOnline: navigator.onLine,
    mapboxReachable: false,
    lastChecked: 0
  });
  const watchId = React.useRef<number | null>(null);

  // Check network connectivity and Mapbox API availability
  const checkConnectivity = async () => {
    const now = Date.now();
    
    // Basic online check
    const isOnline = navigator.onLine;
    
    // Test Mapbox API reachability
    let mapboxReachable = false;
    try {
      const response = await fetch('https://api.mapbox.com/styles/v1/mapbox?access_token=' + MAPBOX_TOKEN, {
        method: 'HEAD',
        timeout: 5000
      } as RequestInit);
      mapboxReachable = response.ok;
    } catch (error) {
      console.warn('Mapbox API connectivity test failed:', error);
      mapboxReachable = false;
    }

    setConnectivity({
      isOnline,
      mapboxReachable,
      lastChecked: now
    });

    return { isOnline, mapboxReachable };
  };

  // Enhanced retry mechanism
  const retryMapInitialization = async () => {
    if (retryCount >= 3) {
      setMapError("Failed to connect to map services after multiple attempts. Please check your internet connection and try again.");
      return;
    }

    setMapError(null);
    setRetryCount(prev => prev + 1);
    
    const { isOnline, mapboxReachable } = await checkConnectivity();
    
    if (!isOnline) {
      setMapError("No internet connection detected. Please check your network and try again.");
      return;
    }
    
    if (!mapboxReachable) {
      setMapError("Cannot reach map services. This may be due to network restrictions or temporary service issues.");
      return;
    }

    // Retry initialization
    initializeMap();
  };

  const initializeMap = async () => {
    if (!mapContainer.current) return;

    // Check if Mapbox token is available
    if (!MAPBOX_TOKEN) {
      setMapError("Mapbox access token is missing. Please check your environment configuration.");
      console.error("Mapbox access token is missing. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file.");
      return;
    }

    // Set the access token
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Validate token format
    if (!MAPBOX_TOKEN.startsWith('pk.')) {
      setMapError("Invalid Mapbox access token format. Token should start with 'pk.'");
      console.error("Invalid Mapbox access token format.");
      return;
    }

    try {
      // Clear any existing map content
      if (mapContainer.current.firstChild) {
        mapContainer.current.innerHTML = '';
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [-0.1276, 51.5072], // Default to London
        zoom: 15,
        attributionControl: false,
        maxRetries: 3,
        retryDelayMin: 1000,
        retryDelayMax: 5000
      });

      // Add navigation control
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        setIsMapLoaded(true);
        setMapError(null);
        setRetryCount(0); // Reset retry count on success
        
        // Initialize data sources
        if (map.current) {
          // Generated route source
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: []
              }
            }
          });

          // Breadcrumb trail source
          map.current.addSource('breadcrumbs', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: []
              }
            }
          });

          // Moments source
          map.current.addSource('moments', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            }
          });

          // Add route layer
          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3B82F6',
              'line-width': 4,
              'line-opacity': 0.8
            }
          });

          // Add breadcrumb layer
          map.current.addLayer({
            id: 'breadcrumbs',
            type: 'line',
            source: 'breadcrumbs',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#10B981',
              'line-width': 3,
              'line-dasharray': [2, 2]
            }
          });

          // Add moments layer
          map.current.addLayer({
            id: 'moments',
            type: 'circle',
            source: 'moments',
            paint: {
              'circle-radius': 8,
              'circle-color': '#F59E0B',
              'circle-stroke-width': 2,
              'circle-stroke-color': '#FFFFFF'
            }
          });

          // Handle map clicks for moments
          map.current.on('click', (e) => {
            if (walkState === 'active' && onMomentPin) {
              onMomentPin({
                lat: e.lngLat.lat,
                lng: e.lngLat.lng
              });
            }
          });
        }
      });

      // Enhanced error handling
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e.error);
        const errorMessage = e.error?.message || 'Unknown map error';
        
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('network')) {
          setMapError("Network connectivity issue detected. Please check your internet connection.");
        } else if (errorMessage.includes('Unauthorized')) {
          setMapError("Map authorization failed. Please check your Mapbox access token.");
        } else {
          setMapError(`Map error: ${errorMessage}`);
        }
      });

      // Get initial user location
      getCurrentLocation();

    } catch (error) {
      console.error('Error initializing map:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setMapError("Network error while loading map. Please check your connection and try again.");
      } else {
        setMapError(`Failed to initialize map: ${errorMessage}`);
      }
    }
  };

  // Initialize map
  React.useEffect(() => {
    // Check initial connectivity
    checkConnectivity().then(() => {
      initializeMap();
    });

    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
      map.current?.remove();
    };
  }, []);

  // Listen to online/offline events
  React.useEffect(() => {
    const handleOnline = () => {
      setConnectivity(prev => ({ ...prev, isOnline: true }));
      if (mapError && !isMapLoaded) {
        retryMapInitialization();
      }
    };

    const handleOffline = () => {
      setConnectivity(prev => ({ ...prev, isOnline: false }));
      setMapError("No internet connection. Map features are unavailable.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [mapError, isMapLoaded]);

  // Update route when generatedRoute changes
  React.useEffect(() => {
    if (isMapLoaded && map.current) {
      const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: generatedRoute as number[][]
          }
        });

        // Fit to route if it exists
        if (generatedRoute.length > 0) {
          const bounds = new mapboxgl.LngLatBounds();
          generatedRoute.forEach(coord => bounds.extend(coord));
          map.current?.fitBounds(bounds, { padding: 50 });
        }
      }
    }
  }, [generatedRoute, isMapLoaded]);

  // Update breadcrumb trail when it changes
  React.useEffect(() => {
    if (isMapLoaded && map.current) {
      const source = map.current.getSource('breadcrumbs') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: breadcrumbTrail as number[][]
          }
        });
      }
    }
  }, [breadcrumbTrail, isMapLoaded]);

  // Update moments when they change
  React.useEffect(() => {
    if (isMapLoaded && map.current) {
      const source = map.current.getSource('moments') as mapboxgl.GeoJSONSource;
      if (source) {
        const features = moments.map(moment => ({
          type: 'Feature' as const,
          properties: {
            id: moment.id,
            description: moment.description,
            photo_url: moment.photo_url
          },
          geometry: {
            type: 'Point' as const,
            coordinates: [moment.lng, moment.lat]
          }
        }));

        source.setData({
          type: 'FeatureCollection',
          features
        });
      }
    }
  }, [moments, isMapLoaded]);

  // Handle location tracking
  React.useEffect(() => {
    if (isTracking) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [isTracking]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          coords: position.coords,
          timestamp: position.timestamp
        };
        setUserLocation(newLocation);
        setLocationError(null);
        updateUserMarker(position.coords);
        centerMapOnUser(position.coords);
        
        if (onLocationUpdate) {
          onLocationUpdate(position.coords);
        }
      },
      (error) => {
        setLocationError(`Location error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const startLocationTracking = () => {
    if (!navigator.geolocation) return;

    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          coords: position.coords,
          timestamp: position.timestamp
        };
        setUserLocation(newLocation);
        updateUserMarker(position.coords);
        
        if (onLocationUpdate) {
          onLocationUpdate(position.coords);
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  };

  const stopLocationTracking = () => {
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  };

  const updateUserMarker = (coords: GeolocationCoordinates) => {
    if (!map.current) return;

    const lngLat: mapboxgl.LngLatLike = [coords.longitude, coords.latitude];

    if (userMarker.current) {
      userMarker.current.setLngLat(lngLat);
    } else {
      // Create custom user marker
      const el = document.createElement('div');
      el.className = 'user-location-marker';
      el.style.backgroundImage = 'radial-gradient(circle, #3B82F6 30%, rgba(59, 130, 246, 0.3) 70%)';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.3)';

      userMarker.current = new mapboxgl.Marker(el)
        .setLngLat(lngLat)
        .addTo(map.current);
    }
  };

  const centerMapOnUser = (coords: GeolocationCoordinates) => {
    if (!map.current) return;

    map.current.flyTo({
      center: [coords.longitude, coords.latitude],
      zoom: 16,
      duration: 1000
    });
  };

  const handleRecenter = () => {
    if (userLocation) {
      centerMapOnUser(userLocation.coords);
    } else {
      getCurrentLocation();
    }
  };

  const handleZoomIn = () => {
    if (map.current) {
      map.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (map.current) {
      map.current.zoomOut();
    }
  };

  if (mapError) {
    return (
      <div className={`rounded-lg bg-muted flex flex-col items-center justify-center text-center p-6 h-full ${className}`}>
        <div className="flex items-center justify-center mb-4">
          {connectivity.isOnline ? (
            <Wifi className="w-16 h-16 text-muted-foreground" />
          ) : (
            <WifiOff className="w-16 h-16 text-muted-foreground" />
          )}
        </div>
        <h3 className="font-bold text-xl text-foreground mb-2">Map Unavailable</h3>
        <p className="text-muted-foreground text-sm max-w-sm mb-4">
          {mapError}
        </p>
        
        {/* Connectivity Status */}
        <div className="text-xs text-muted-foreground mb-4 space-y-1">
          <div>Network: {connectivity.isOnline ? '✅ Online' : '❌ Offline'}</div>
          <div>Map Service: {connectivity.mapboxReachable ? '✅ Available' : '❌ Unavailable'}</div>
          {retryCount > 0 && <div>Retry attempts: {retryCount}/3</div>}
        </div>

        {/* Retry Button */}
        <Button onClick={retryMapInitialization} className="mb-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <details className="text-xs bg-secondary text-secondary-foreground rounded p-3 mt-2">
            <summary className="cursor-pointer mb-2">Debug Info</summary>
            <div className="space-y-1 text-left">
              <div>Token: {MAPBOX_TOKEN ? '✅ Present' : '❌ Missing'}</div>
              <div>Token Format: {MAPBOX_TOKEN?.startsWith('pk.') ? '✅ Valid' : '❌ Invalid'}</div>
              <div>Browser: {navigator.userAgent}</div>
            </div>
          </details>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleRecenter}
          className="bg-background/90 backdrop-blur-sm shadow-md"
        >
          <Target className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="bg-background/90 backdrop-blur-sm shadow-md"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="bg-background/90 backdrop-blur-sm shadow-md"
        >
          <Minus className="h-4 w-4" />
        </Button>
      </div>

      {/* Connection Status Indicator */}
      {!connectivity.isOnline && (
        <div className="absolute top-4 left-4 bg-destructive/90 text-destructive-foreground px-3 py-2 rounded-md text-sm backdrop-blur-sm flex items-center gap-2">
          <WifiOff className="h-4 w-4" />
          Offline
        </div>
      )}

      {/* Location Error */}
      {locationError && (
        <div className="absolute top-4 left-4 bg-destructive/90 text-destructive-foreground px-3 py-2 rounded-md text-sm backdrop-blur-sm">
          {locationError}
        </div>
      )}

      {/* Moment Pin Hint */}
      {walkState === 'active' && (
        <div className="absolute bottom-20 left-4 right-4 bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm backdrop-blur-sm text-center">
          <Camera className="h-4 w-4 inline mr-2" />
          Tap anywhere on the map to pin a moment
        </div>
      )}
    </div>
  );
} 