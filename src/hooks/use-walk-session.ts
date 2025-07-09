"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { generateWalkingRoute, latLngToCoords, coordsToLatLng } from '@/lib/route-generation';

export type WalkState = 'idle' | 'generating' | 'preview' | 'active' | 'paused' | 'completed';

export interface WalkMoment {
  id: string;
  lat: number;
  lng: number;
  timestamp: number;
  photo_url?: string;
  description?: string;
}

export interface WalkSession {
  id?: string;
  user_id: string;
  title?: string;
  start_time: number;
  end_time?: number;
  total_distance: number;
  total_duration: number;
  route_path: google.maps.LatLng[];
  planned_route?: google.maps.LatLng[];
  moments: WalkMoment[];
  status: 'active' | 'paused' | 'completed';
}

export interface LiveStats {
  duration: number;
  distance: number;
  pace: number;
  speed: number;
}

export function useWalkSession(userId?: string) {
  const [walkState, setWalkState] = useState<WalkState>('idle');
  const [currentSession, setCurrentSession] = useState<WalkSession | null>(null);
  const [generatedRoute, setGeneratedRoute] = useState<{ coordinates: google.maps.LatLng[]; distance: number; duration: number } | null>(null);
  const [breadcrumbTrail, setBreadcrumbTrail] = useState<google.maps.LatLng[]>([]);
  const [moments, setMoments] = useState<WalkMoment[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    duration: 0,
    distance: 0,
    pace: 0,
    speed: 0
  });
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for tracking
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Generate route function
  const generateRoute = useCallback(async (options: {
    startLocation: { lat: number; lng: number };
    duration: number;
    complexity?: 'simple' | 'medium' | 'complex';
  }) => {
    if (!userId) {
      setError('User not authenticated');
      return;
    }

    setIsLoading(true);
    setError(null);
    setWalkState('generating');

    try {
      const result = await generateWalkingRoute({
        startLocation: options.startLocation,
        duration: options.duration,
        complexity: options.complexity || 'medium'
      });

      if (result.success && result.route) {
        setGeneratedRoute({
          coordinates: result.route.coordinates,
          distance: result.route.distance,
          duration: result.route.duration
        });
        setWalkState('preview');
      } else {
        throw new Error(result.error || 'Failed to generate route');
      }
    } catch (err) {
      console.error('Route generation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate route');
      setWalkState('idle');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Start walk function
  const startWalk = useCallback((title?: string) => {
    if (!userId || !generatedRoute) {
      setError('Cannot start walk: missing requirements');
      return;
    }

    const now = Date.now();
    startTimeRef.current = now;

    const session: WalkSession = {
      user_id: userId,
      title: title || `Walk ${new Date().toLocaleDateString()}`,
      start_time: now,
      total_distance: 0,
      total_duration: 0,
      route_path: [],
      planned_route: generatedRoute.coordinates,
      moments: [],
      status: 'active'
    };

    setCurrentSession(session);
    setWalkState('active');
    setBreadcrumbTrail([]);
    setMoments([]);
    setLiveStats({
      duration: 0,
      distance: 0,
      pace: 0,
      speed: 0
    });

    // Start live tracking
    startLiveTracking();
  }, [userId, generatedRoute]);

  // Start live tracking
  const startLiveTracking = useCallback(() => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      if (startTimeRef.current && walkState === 'active') {
        const now = Date.now();
        const duration = Math.floor((now - startTimeRef.current) / 1000);
        const distance = calculateTrailDistance(breadcrumbTrail);
        const speed = duration > 0 ? (distance / 1000) / (duration / 3600) : 0; // km/h
        const pace = speed > 0 ? 60 / speed : 0; // minutes per km

        setLiveStats({
          duration,
          distance,
          pace,
          speed
        });
      }
    }, 1000);
  }, [breadcrumbTrail, walkState]);

  // Stop live tracking
  const stopLiveTracking = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Pause walk
  const pauseWalk = useCallback(() => {
    setWalkState('paused');
    stopLiveTracking();
  }, [stopLiveTracking]);

  // Resume walk
  const resumeWalk = useCallback(() => {
    setWalkState('active');
    startLiveTracking();
  }, [startLiveTracking]);

  // End walk function
  const endWalk = useCallback(async () => {
    if (!currentSession || !userId) {
      setError('No active session to end');
      return;
    }

    setIsLoading(true);
    stopLiveTracking();

    try {
      const endTime = Date.now();
      const finalDistance = calculateTrailDistance(breadcrumbTrail);
      const finalDuration = Math.floor((endTime - currentSession.start_time) / 1000);

      const completedSession: WalkSession = {
        ...currentSession,
        end_time: endTime,
        total_distance: finalDistance,
        total_duration: finalDuration,
        route_path: breadcrumbTrail,
        moments,
        status: 'completed'
      };

      // Save to Supabase and get the walk ID
      const { data: savedWalk, error: saveError } = await supabase
        .from('walks_enhanced')
        .insert({
          user_id: userId,
          title: completedSession.title,
          start_time: new Date(completedSession.start_time).toISOString(),
          end_time: new Date(endTime).toISOString(),
          total_distance: finalDistance,
          total_duration: finalDuration,
          route_path: breadcrumbTrail.map(point => latLngToCoords(point)),
          planned_route: generatedRoute?.coordinates.map(point => latLngToCoords(point)),
          status: 'completed'
        })
        .select('id')
        .single();

      if (saveError) {
        console.error('Failed to save walk:', saveError);
        setError('Failed to save walk data');
        return;
      }

      // Save moments with the correct walk_id
      if (moments.length > 0 && savedWalk?.id) {
        const { error: momentsError } = await supabase
          .from('walk_moments')
          .insert(
            moments.map(moment => ({
              walk_id: savedWalk.id,
              latitude: moment.lat,
              longitude: moment.lng,
              photo_url: moment.photo_url,
              description: moment.description,
              created_at: new Date(moment.timestamp).toISOString()
            }))
          );

        if (momentsError) {
          console.error('Failed to save moments:', momentsError);
        }
      }

      setCurrentSession(completedSession);
      setWalkState('completed');

    } catch (err) {
      console.error('Failed to end walk:', err);
      setError('Failed to save walk data');
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, userId, breadcrumbTrail, moments, generatedRoute, stopLiveTracking]);

  // Add moment function
  const addMoment = useCallback((location: { lat: number; lng: number }, description?: string, photoUrl?: string) => {
    const moment: WalkMoment = {
      id: `moment_${Date.now()}`,
      lat: location.lat,
      lng: location.lng,
      timestamp: Date.now(),
      description,
      photo_url: photoUrl
    };

    setMoments(prev => [...prev, moment]);
  }, []);

  // Handle location update
  const handleLocationUpdate = useCallback((coords: GeolocationCoordinates) => {
    const newLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude
    };
    
    setUserLocation(newLocation);

    // Add to breadcrumb trail if actively walking
    if (walkState === 'active') {
      const newPoint = coordsToLatLng({ lat: coords.latitude, lng: coords.longitude });
      
      // Only add if we've moved a significant distance (reduce noise)
      const lastLocation = lastLocationRef.current;
      if (!lastLocation || calculateDistance(
        { lat: coords.latitude, lng: coords.longitude },
        lastLocation
      ) > 5) { // 5 meters minimum
        setBreadcrumbTrail(prev => [...prev, newPoint]);
        lastLocationRef.current = { lat: coords.latitude, lng: coords.longitude };
      }
    }
  }, [walkState]);

  // Reset session
  const resetSession = useCallback(() => {
    setWalkState('idle');
    setCurrentSession(null);
    setGeneratedRoute(null);
    setBreadcrumbTrail([]);
    setMoments([]);
    setLiveStats({
      duration: 0,
      distance: 0,
      pace: 0,
      speed: 0
    });
    setError(null);
    stopLiveTracking();
    startTimeRef.current = null;
    lastLocationRef.current = null;
  }, [stopLiveTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopLiveTracking();
    };
  }, [stopLiveTracking]);

  return {
    // State
    walkState,
    currentSession,
    generatedRoute,
    breadcrumbTrail,
    moments,
    liveStats,
    userLocation,
    error,
    isLoading,

    // Actions
    generateRoute,
    startWalk,
    pauseWalk,
    resumeWalk,
    endWalk,
    addMoment,
    handleLocationUpdate,
    resetSession,

    // Computed properties
    isTracking: walkState === 'active',
    hasActiveSession: currentSession !== null,
    canStartWalk: walkState === 'preview' && generatedRoute !== null
  };
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Helper function to calculate total distance of a trail
function calculateTrailDistance(trail: google.maps.LatLng[]): number {
  if (trail.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < trail.length; i++) {
    const point1 = latLngToCoords(trail[i - 1]);
    const point2 = latLngToCoords(trail[i]);
    totalDistance += calculateDistance(point1, point2);
  }

  return totalDistance;
} 