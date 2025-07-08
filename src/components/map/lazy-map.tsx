"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { WalklyMapProps } from "./walkly-map";
import { WalkSessionOverlayProps } from "./walk-session-overlay";

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

export function LazyMap({ mapProps, overlayProps }: LazyMapProps) {
  const [isMapboxReady, setIsMapboxReady] = React.useState(false);
  const [mapError, setMapError] = React.useState<string | null>(null);

  // Pre-load Mapbox resources
  React.useEffect(() => {
    const preloadMapbox = async () => {
      try {
        // Check if Mapbox token exists
        const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
        if (!token) {
          throw new Error("Mapbox token not found");
        }

        // Pre-load critical Mapbox resources
        const styleUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${token}`;
        
        // Test connectivity
        const response = await fetch(styleUrl, { method: 'HEAD' });
        if (!response.ok) {
          throw new Error("Mapbox API not reachable");
        }

        setIsMapboxReady(true);
      } catch (error) {
        console.error("Mapbox preload error:", error);
        setMapError(error instanceof Error ? error.message : "Failed to load map");
      }
    };

    preloadMapbox();
  }, []);

  if (mapError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-destructive/5">
        <div className="text-center space-y-4 p-6">
          <div className="text-destructive text-4xl">⚠️</div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Map Unavailable</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              {mapError}
            </p>
            <button 
              onClick={() => {
                setMapError(null);
                window.location.reload();
              }}
              className="text-sm text-primary hover:underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!isMapboxReady) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted/5">
        <div className="text-center space-y-4">
          <LoadingSpinner size="xl" />
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Preparing Map</h3>
            <p className="text-sm text-muted-foreground">
              Connecting to map services...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <React.Suspense 
      fallback={
        <div className="h-full w-full flex items-center justify-center bg-muted/10">
          <LoadingSpinner size="xl" text="Loading Map Interface..." centered />
        </div>
      }
    >
      <div className="relative h-full overflow-hidden">
        <WalklyMap {...mapProps} />
        <WalkSessionOverlay {...overlayProps} />
      </div>
    </React.Suspense>
  );
} 