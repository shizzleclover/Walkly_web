"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { WalklyMapProps } from "./walkly-map";
import { WalkSessionOverlayProps } from "./walk-session-overlay";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from "lucide-react";

// Lazy load the heavy map components
const WalklyMap = dynamic(() => import("./walkly-map").then(mod => ({ default: mod.WalklyMap })), {
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-muted/10">
      <div className="text-center space-y-4">
        <LoadingSpinner size="large" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Loading Map</h3>
          <p className="text-sm text-muted-foreground">
            Initializing GPS and map services...
          </p>
        </div>
      </div>
    </div>
  ),
  ssr: false, // Map can't be server-side rendered
});

const WalkSessionOverlay = dynamic(() => import("./walk-session-overlay").then(mod => ({ default: mod.WalkSessionOverlay })), {
  loading: () => (
    <div className="absolute bottom-6 left-4 right-4 z-10">
      <div className="bg-card/95 backdrop-blur-sm border rounded-2xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <LoadingSpinner size="small" />
          <span className="text-sm text-muted-foreground">Loading controls...</span>
        </div>
      </div>
    </div>
  ),
  ssr: false,
});

interface LazyMapProps {
  mapProps: WalklyMapProps;
  overlayProps: WalkSessionOverlayProps;
}

// Simplified connectivity check with quick timeout
async function quickConnectivityCheck(): Promise<boolean> {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) return false;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    const response = await fetch(`https://api.mapbox.com/styles/v1/mapbox/streets-v12`, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false; // Fail silently and continue
  }
}

export function LazyMap({ mapProps, overlayProps }: LazyMapProps) {
  const [loadingState, setLoadingState] = React.useState<{
    isLoading: boolean;
    hasConnectivityIssue: boolean;
    shouldShowMap: boolean;
  }>({
    isLoading: true,
    hasConnectivityIssue: false,
    shouldShowMap: false
  });

  React.useEffect(() => {
    let mounted = true;

    const initializeMap = async () => {
      // Always ensure we show the map within 5 seconds maximum
      const maxLoadingTimeout = setTimeout(() => {
        if (mounted) {
          setLoadingState({
            isLoading: false,
            hasConnectivityIssue: false,
            shouldShowMap: true
          });
        }
      }, 5000);

      try {
        // Quick connectivity check (max 3 seconds)
        const hasConnectivity = await quickConnectivityCheck();
        
        if (mounted) {
          // Wait a brief moment for better UX, then show map
          setTimeout(() => {
            if (mounted) {
              clearTimeout(maxLoadingTimeout);
              setLoadingState({
                isLoading: false,
                hasConnectivityIssue: !hasConnectivity,
                shouldShowMap: true
              });
            }
          }, 1000);
        }
      } catch (error) {
        console.warn('Connectivity check failed:', error);
        
        if (mounted) {
          // Show map anyway after brief delay
          setTimeout(() => {
            if (mounted) {
              clearTimeout(maxLoadingTimeout);
              setLoadingState({
                isLoading: false,
                hasConnectivityIssue: true,
                shouldShowMap: true
              });
            }
          }, 2000);
        }
      }

      return () => {
        clearTimeout(maxLoadingTimeout);
      };
    };

    initializeMap();

    return () => {
      mounted = false;
    };
  }, []);

  const handleRetry = () => {
    setLoadingState({
      isLoading: true,
      hasConnectivityIssue: false,
      shouldShowMap: false
    });
    
    // Retry after a brief delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Show loading state
  if (loadingState.isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/5">
        <div className="text-center space-y-4">
          <div className="relative">
            <LoadingSpinner size="xl" />
            <Wifi className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Preparing Map</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Connecting to map services...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show map once ready
  if (loadingState.shouldShowMap) {
    return (
      <React.Suspense 
        fallback={
          <div className="h-full w-full flex items-center justify-center bg-muted/10">
            <div className="text-center space-y-4">
              <LoadingSpinner size="xl" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Initializing Map</h3>
                <p className="text-sm text-muted-foreground">
                  Loading map interface...
                </p>
              </div>
            </div>
          </div>
        }
      >
        <div className="relative w-full h-full overflow-hidden">
          <WalklyMap {...mapProps} className="w-full h-full" />
          <WalkSessionOverlay {...overlayProps} />
          
          {/* Show connectivity warning if there were issues */}
          {loadingState.hasConnectivityIssue && (
            <div className="absolute top-4 left-4 right-4 z-50">
              <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <span className="text-yellow-800 dark:text-yellow-200">
                      Network connectivity issues detected. Some features may be limited.
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={handleRetry}
                      className="ml-auto h-6 px-2 text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </React.Suspense>
    );
  }

  // Fallback (shouldn't reach here, but just in case)
  return (
    <div className="h-full w-full flex items-center justify-center bg-muted/10">
      <div className="text-center space-y-4">
        <LoadingSpinner size="xl" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Loading Map</h3>
          <p className="text-sm text-muted-foreground">
            Initializing components...
          </p>
        </div>
        <Button onClick={handleRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    </div>
  );
} 