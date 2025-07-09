"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw, Wifi, WifiOff } from "lucide-react";
import { GoogleMapWalklyProps } from "./google-map";
import { WalkSessionOverlayProps } from "./walk-session-overlay";

// Dynamically import the Google Maps component with no SSR
const GoogleMapWalkly = dynamic(() => import("./google-map").then(mod => ({ default: mod.GoogleMapWalkly })), {
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted">
      <LoadingSpinner 
        size="large" 
        text="Loading Map" 
        centered 
      />
    </div>
  ),
  ssr: false
});

// Dynamically import the walk session overlay
const WalkSessionOverlay = dynamic(() => import("./walk-session-overlay").then(mod => ({ default: mod.WalkSessionOverlay })), {
  loading: () => null,
  ssr: false
});

interface LazyMapProps {
  mapProps: GoogleMapWalklyProps;
  overlayProps: WalkSessionOverlayProps;
}

interface MapError {
  type: 'connectivity' | 'api' | 'location' | 'unknown';
  message: string;
  retryable: boolean;
}

async function quickConnectivityCheck(): Promise<boolean> {
  try {
    // Check if we can reach Google's servers
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('https://maps.googleapis.com/maps/api/js', {
      method: 'HEAD',
      signal: controller.signal,
      mode: 'no-cors' // Avoid CORS issues for connectivity test
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.warn('Google Maps API connectivity check failed:', error);
    return false;
  }
}

export function LazyMap({ mapProps, overlayProps }: LazyMapProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<MapError | null>(null);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [retryCount, setRetryCount] = React.useState(0);

  React.useEffect(() => {
    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if Google Maps API key is configured
        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
          throw new Error('Google Maps API key not configured');
        }

        // Check network connectivity
        if (!navigator.onLine) {
          throw new Error('No internet connection');
        }

        // Quick connectivity check to Google's servers
        const isConnected = await quickConnectivityCheck();
        if (!isConnected) {
          console.warn('Google Maps API connectivity check failed, but continuing...');
          // Don't throw error here - let the map try to load anyway
        }

        // Small delay to ensure dynamic imports are ready
        await new Promise(resolve => setTimeout(resolve, 300));

        setIsLoading(false);

      } catch (err) {
        console.error('Map initialization error:', err);
        
        let mapError: MapError;
        const errorMessage = err instanceof Error ? err.message.toLowerCase() : 'unknown error';

        if (errorMessage.includes('network') || errorMessage.includes('connection')) {
          mapError = {
            type: 'connectivity',
            message: 'Network connection issue. Please check your internet connection.',
            retryable: true
          };
        } else if (errorMessage.includes('api key') || errorMessage.includes('not configured')) {
          mapError = {
            type: 'api',
            message: 'Map service configuration error. Please check API settings.',
            retryable: false
          };
        } else if (errorMessage.includes('location') || errorMessage.includes('geolocation')) {
          mapError = {
            type: 'location',
            message: 'Location services unavailable. Please enable location access.',
            retryable: true
          };
        } else {
          mapError = {
            type: 'unknown',
            message: 'Map failed to load. Please try again.',
            retryable: true
          };
        }

        setError(mapError);
        setIsLoading(false);
      }
    };

    initializeMap();
  }, [retryCount]);

  // Handle online/offline events
  React.useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (error?.type === 'connectivity') {
        handleRetry();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setError({
        type: 'connectivity',
        message: 'You are offline. Map features may be limited.',
        retryable: true
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted relative">
        <div className="text-center space-y-4 max-w-sm mx-auto p-6">
          <LoadingSpinner size="large" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Loading Map</h3>
            <p className="text-sm text-muted-foreground">
              Initializing GPS and map services...
            </p>
          </div>
          {!isOnline && (
            <div className="flex items-center justify-center gap-2 text-destructive">
              <WifiOff className="h-4 w-4" />
              <span className="text-sm">Offline</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 bg-destructive/10 rounded-full mx-auto">
              {error.type === 'connectivity' ? (
                <WifiOff className="w-8 h-8 text-destructive" />
              ) : (
                <AlertCircle className="w-8 h-8 text-destructive" />
              )}
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Map Unavailable
              </h3>
              <p className="text-sm text-muted-foreground">
                {error.message}
              </p>
            </div>

            {!isOnline && (
              <div className="flex items-center justify-center gap-2 text-destructive text-sm">
                <WifiOff className="h-4 w-4" />
                <span>Currently offline</span>
              </div>
            )}

            {error.retryable && (
              <div className="space-y-2">
                <Button 
                  onClick={handleRetry} 
                  variant="outline" 
                  className="w-full gap-2"
                  disabled={!isOnline && error.type === 'connectivity'}
                >
                  <RotateCcw className="w-4 h-4" />
                  Try Again
                </Button>
                {retryCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Retry attempt: {retryCount}
                  </p>
                )}
              </div>
            )}

            {error.type === 'api' && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>If this error persists, please contact support.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render the map with overlay
  return (
    <div className="relative w-full h-full">
      <GoogleMapWalkly {...mapProps} />
      <WalkSessionOverlay {...overlayProps} />
    </div>
  );
} 