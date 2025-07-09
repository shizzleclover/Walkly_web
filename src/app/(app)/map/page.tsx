"use client";

import * as React from "react";
import { AppLayout } from "@/components/app-layout";
import { LazyMap } from "@/components/map/lazy-map";
import { useWalkSession } from "@/hooks/use-walk-session";
import { useAuthState } from "@/hooks/use-auth";
import { useLoading } from "@/components/loading-provider";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useNavigation } from "@/hooks/use-navigation";
import { coordsToLatLng, latLngToCoords } from "@/lib/route-generation";

export default function MapPage() {
  const { navigateToLogin, hideLoading } = useNavigation();
  const { user, loading: authLoading } = useAuthState();

  // Hide loading when the page is fully loaded
  React.useEffect(() => {
    if (!authLoading && user) {
      // Small delay to ensure components are mounted
      const timer = setTimeout(() => {
        hideLoading();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user]); // Removed hideLoading from deps to prevent infinite re-renders
  
  const {
    walkState,
    currentSession,
    generatedRoute,
    breadcrumbTrail,
    moments,
    liveStats,
    userLocation,
    error,
    isLoading,
    generateRoute,
    startWalk,
    pauseWalk,
    resumeWalk,
    endWalk,
    addMoment,
    handleLocationUpdate,
    resetSession,
    isTracking,
    hasActiveSession,
    canStartWalk
  } = useWalkSession(user?.id);

  // Handle route generation
  const handleGenerateRoute = React.useCallback((duration: number) => {
    if (!userLocation) {
      console.error('User location not available');
      return;
    }

    generateRoute({
      startLocation: {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      },
      duration,
      complexity: 'medium'
    });
  }, [userLocation, generateRoute]);

  // Handle trying another route
  const handleTryAnotherRoute = React.useCallback(() => {
    if (!userLocation) return;

    // Generate a new route with the same duration but different complexity/randomness
    generateRoute({
      startLocation: {
        lat: userLocation.latitude,
        lng: userLocation.longitude
      },
      duration: 30, // Default duration for regeneration
      complexity: ['simple', 'medium', 'complex'][Math.floor(Math.random() * 3)] as any
    });
  }, [userLocation, generateRoute]);

  // Handle moment pinning from map
  const handleMomentPin = React.useCallback((location: { lat: number; lng: number }) => {
    if (walkState === 'active') {
      addMoment(location);
    }
  }, [walkState, addMoment]);

  // Handle moment adding with description
  const handleAddMoment = React.useCallback((description?: string) => {
    if (!userLocation) return;
    
    addMoment({
      lat: userLocation.latitude,
      lng: userLocation.longitude
    }, description);
  }, [userLocation, addMoment]);

  // Show loading state while authentication is loading
  if (authLoading) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center bg-background">
          <LoadingSpinner 
            size="large" 
            text="Authenticating..." 
            centered 
          />
        </div>
      </AppLayout>
    );
  }

  // Show authentication required state
  if (!user) {
    return (
      <AppLayout>
        <div className="h-full flex items-center justify-center bg-background p-6">
          <Card className="max-w-md w-full">
            <CardContent className="p-6 text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto" />
              <h2 className="text-xl font-semibold">Authentication Required</h2>
              <p className="text-muted-foreground">
                Please sign in to start tracking your walks and create routes.
              </p>
              <Button onClick={navigateToLogin} className="w-full">
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  // Prepare props for lazy-loaded components
  const mapProps = {
    walkState,
    isTracking,
    generatedRoute: generatedRoute?.coordinates || [],
    breadcrumbTrail,
    moments,
    onLocationUpdate: handleLocationUpdate,
    onMomentPin: handleMomentPin,
    className: "w-full h-full"
  };

  const overlayProps = {
    walkState,
    liveStats,
    currentSession,
    generatedRoute,
    isLoading,
    error,
    onGenerateRoute: handleGenerateRoute,
    onStartWalk: startWalk,
    onPauseWalk: pauseWalk,
    onResumeWalk: resumeWalk,
    onEndWalk: endWalk,
    onTryAnotherRoute: handleTryAnotherRoute,
    onAddMoment: handleAddMoment
  };

  return (
    <AppLayout>
      <div className="relative h-[calc(100vh-5rem)] overflow-hidden">
        {/* Lazy-loaded Map with Overlay */}
        <LazyMap 
          mapProps={mapProps}
          overlayProps={overlayProps}
        />

        {/* Development Info Overlay (optional - remove in production) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-4 left-4 bg-black/80 text-white p-2 rounded text-xs max-w-xs z-50">
            <div>State: {walkState}</div>
            <div>Location: {userLocation ? `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}` : 'None'}</div>
            <div>Route Points: {generatedRoute?.coordinates?.length || 0}</div>
            <div>Breadcrumbs: {breadcrumbTrail.length}</div>
            <div>Moments: {moments.length}</div>
            {error && <div className="text-red-400">Error: {error}</div>}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
