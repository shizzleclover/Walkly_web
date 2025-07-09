"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from '@react-google-maps/api';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, ZoomIn, ZoomOut, RotateCcw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface GoogleMapWalklyProps {
  onLocationUpdate?: (coords: GeolocationCoordinates) => void;
  onMomentPin?: (location: { lat: number; lng: number }) => void;
  walkState: 'idle' | 'generating' | 'preview' | 'active' | 'paused' | 'completed';
  isTracking?: boolean;
  generatedRoute?: google.maps.LatLng[];
  breadcrumbTrail?: google.maps.LatLng[];
  moments?: Array<{ id: string; lat: number; lng: number; photo_url?: string; description?: string }>;
  className?: string;
}

interface UserLocation {
  coords: GeolocationCoordinates;
  timestamp: number;
}

interface ConnectivityStatus {
  isOnline: boolean;
  googleMapsReachable: boolean;
  lastChecked: number;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 37.7749,
  lng: -122.4194 // San Francisco default
};

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
  gestureHandling: 'greedy',
  styles: [], // Will be set based on theme
};

const libraries: ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[] = ['places'];

export function GoogleMapWalkly({
  onLocationUpdate,
  onMomentPin,
  walkState,
  isTracking = false,
  generatedRoute = [],
  breadcrumbTrail = [],
  moments = [],
  className = ""
}: GoogleMapWalklyProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>({
    isOnline: navigator.onLine,
    googleMapsReachable: true,
    lastChecked: Date.now()
  });
  const [selectedMoment, setSelectedMoment] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Check connectivity
  const checkConnectivity = useCallback(async () => {
    const now = Date.now();
    if (now - connectivity.lastChecked < 30000) return; // Check max once per 30 seconds

    setConnectivity(prev => ({ ...prev, isOnline: navigator.onLine, lastChecked: now }));
  }, [connectivity.lastChecked]);

  // Initialize location tracking when tracking is enabled
  useEffect(() => {
    if (isTracking) {
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [isTracking]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setConnectivity(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setConnectivity(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Temporarily suppress known Google Maps Marker deprecation warnings
  // TODO: Migrate to AdvancedMarkerElement when @react-google-maps/api supports it
  useEffect(() => {
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      // Suppress the specific deprecation warning for Marker while we plan migration
      if (message.includes('google.maps.Marker is deprecated') || 
          message.includes('google.maps.marker.AdvancedMarkerElement')) {
        return; // Don't log these known warnings
      }
      originalWarn.apply(console, args);
    };

    return () => {
      console.warn = originalWarn; // Restore original console.warn on cleanup
    };
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation: UserLocation = {
          coords: position.coords,
          timestamp: position.timestamp
        };
        
        setUserLocation(newLocation);
        setMapCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        
        if (onLocationUpdate) {
          onLocationUpdate(position.coords);
        }
      },
      (error) => {
        let errorMessage = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable. Please try again.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out. Please try again.';
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }, [onLocationUpdate]);

  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: UserLocation = {
          coords: position.coords,
          timestamp: position.timestamp
        };
        
        setUserLocation(newLocation);
        
        if (onLocationUpdate) {
          onLocationUpdate(position.coords);
        }
      },
      (error) => {
        console.error('Location tracking error:', error);
        let errorMessage = 'Location tracking failed';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location timeout';
            break;
        }
        setLocationError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 1000
      }
    );
  }, [onLocationUpdate]);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  const handleMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (walkState === 'active' && onMomentPin && event.latLng) {
      const location = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      onMomentPin(location);
    }
  }, [walkState, onMomentPin]);

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setIsMapLoaded(true);
    
    // Get initial location
    getCurrentLocation();
  }, [getCurrentLocation]);

  const handleRecenter = useCallback(() => {
    if (userLocation && mapRef.current) {
      const center = {
        lat: userLocation.coords.latitude,
        lng: userLocation.coords.longitude
      };
      setMapCenter(center);
      mapRef.current.panTo(center);
    } else {
      getCurrentLocation();
    }
  }, [userLocation, getCurrentLocation]);

  const handleZoomIn = useCallback(() => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 15;
      mapRef.current.setZoom(Math.min(currentZoom + 1, 20));
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 15;
      mapRef.current.setZoom(Math.max(currentZoom - 1, 1));
    }
  }, []);

  const getRoutePolylineOptions = () => ({
    path: generatedRoute,
    geodesic: true,
    strokeColor: '#47d828',
    strokeOpacity: 0.8,
    strokeWeight: 4,
  });

  const getBreadcrumbPolylineOptions = () => ({
    path: breadcrumbTrail,
    geodesic: true,
    strokeColor: '#2563eb',
    strokeOpacity: 0.9,
    strokeWeight: 3,
  });

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <Card className="max-w-md">
          <CardContent className="p-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold">Map Configuration Required</h3>
            <p className="text-muted-foreground">
              Google Maps API key is missing. Please add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to your environment.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
        libraries={libraries}
        loadingElement={
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <div className="text-center space-y-4">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          </div>
        }
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={16}
          options={mapOptions}
          onLoad={handleMapLoad}
          onClick={handleMapClick}
        >
          {/* User Location Marker - Note: Using legacy Marker (will migrate to AdvancedMarkerElement in future) */}
          {userLocation && (
            <Marker
              position={{
                lat: userLocation.coords.latitude,
                lng: userLocation.coords.longitude
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: '#2563eb',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
              }}
              title="Your Location"
              zIndex={1000}
            />
          )}

          {/* Generated Route */}
          {generatedRoute.length > 0 && (
            <Polyline options={getRoutePolylineOptions()} />
          )}

          {/* Breadcrumb Trail */}
          {breadcrumbTrail.length > 0 && (
            <Polyline options={getBreadcrumbPolylineOptions()} />
          )}

          {/* Moment Markers - Note: Using legacy Marker (will migrate to AdvancedMarkerElement in future) */}
          {moments.map((moment) => (
            <Marker
              key={moment.id}
              position={{ lat: moment.lat, lng: moment.lng }}
              icon={{
                path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                scale: 6,
                fillColor: '#47d828',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 1,
              }}
              title={moment.description || 'Walk moment'}
              onClick={() => setSelectedMoment(moment.id)}
              zIndex={500}
            />
          ))}

          {/* Selected Moment Info Window */}
          {selectedMoment && (
            (() => {
              const moment = moments.find(m => m.id === selectedMoment);
              if (!moment) return null;
              
              return (
                <InfoWindow
                  position={{ lat: moment.lat, lng: moment.lng }}
                  onCloseClick={() => setSelectedMoment(null)}
                >
                  <div className="p-2 max-w-xs">
                    {moment.photo_url && (
                      <img 
                        src={moment.photo_url} 
                        alt="Moment" 
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                    )}
                    <p className="text-sm font-medium">
                      {moment.description || 'Walk moment'}
                    </p>
                  </div>
                </InfoWindow>
              );
            })()
          )}
        </GoogleMap>
      </LoadScript>

      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleRecenter}
          className="bg-background/90 backdrop-blur-sm shadow-lg"
          title="Center on your location"
        >
          <Navigation className="h-4 w-4" />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="bg-background/90 backdrop-blur-sm shadow-lg"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="bg-background/90 backdrop-blur-sm shadow-lg"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Connectivity Status */}
      {!connectivity.isOnline && (
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="destructive" className="gap-1">
            <WifiOff className="h-3 w-3" />
            Offline
          </Badge>
        </div>
      )}

      {/* Location Error */}
      {locationError && (
        <div className="absolute bottom-20 left-4 right-4 z-10">
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-destructive">{locationError}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={getCurrentLocation}
                  className="ml-auto text-destructive hover:text-destructive"
                >
                  <RotateCcw className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Development Info */}
      {process.env.NODE_ENV === 'development' && isMapLoaded && (
        <div className="absolute bottom-4 left-4 bg-black/80 text-white p-2 rounded text-xs max-w-xs z-10">
          <div>State: {walkState}</div>
          <div>Location: {userLocation ? `${userLocation.coords.latitude.toFixed(4)}, ${userLocation.coords.longitude.toFixed(4)}` : 'None'}</div>
          <div>Route Points: {generatedRoute.length}</div>
          <div>Breadcrumbs: {breadcrumbTrail.length}</div>
          <div>Moments: {moments.length}</div>
          <div>Online: {connectivity.isOnline ? 'Yes' : 'No'}</div>
        </div>
      )}
    </div>
  );
} 