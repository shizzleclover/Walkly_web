"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { generateWalkingRoute, type GeneratedRoute, type RouteGenerationOptions } from "@/lib/route-generation";
import mapboxgl from "mapbox-gl";

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
  route_path: mapboxgl.LngLatLike[];
  planned_route?: mapboxgl.LngLatLike[];
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
  const [generatedRoute, setGeneratedRoute] = useState<GeneratedRoute | null>(null);
  const [breadcrumbTrail, setBreadcrumbTrail] = useState<mapboxgl.LngLatLike[]>([]);
  const [moments, setMoments] = useState<WalkMoment[]>([]);
  const [liveStats, setLiveStats] = useState<LiveStats>({
    duration: 0,
    distance: 0,
    pace: 0,
    speed: 0
  });
  const [userLocation, setUserLocation] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startTime = useRef<number>(0);
  const pausedDuration = useRef<number>(0);
  const statsInterval = useRef<NodeJS.Timeout | null>(null);

  const generateRoute = useCallback(async (options: RouteGenerationOptions) => {
    if (!options.startLocation) {
      setError("User location required to generate route");
      return;
    }

    setWalkState('generating');
    setError(null);
    setIsLoading(true);

    try {
      const result = await generateWalkingRoute(options);
      
      if (result.success && result.route) {
        setGeneratedRoute(result.route);
        setWalkState('preview');
      } else {
        setError(result.error || "Failed to generate route");
        setWalkState('idle');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate route");
      setWalkState('idle');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const startWalk = useCallback(async (title?: string) => {
    if (!userId || !userLocation) {
      setError("User authentication and location required");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const now = Date.now();
      startTime.current = now;
      pausedDuration.current = 0;

      const newSession: WalkSession = {
        user_id: userId,
        title: title || `Walk ${new Date().toLocaleDateString()}`,
        start_time: now,
        total_distance: 0,
        total_duration: 0,
        route_path: [[userLocation.longitude, userLocation.latitude]],
        planned_route: generatedRoute?.coordinates,
        moments: [],
        status: 'active'
      };

      // Save to Supabase
      const { data, error: saveError } = await supabase
        .from('walks_enhanced')
        .insert([{
          user_id: userId,
          title: title || `Walk ${new Date().toLocaleDateString()}`,
          start_time: new Date(now).toISOString(),
          route_path: newSession.route_path,
          planned_route: newSession.planned_route,
          status: 'active'
        }])
        .select()
        .single();

      if (saveError) {
        throw new Error(`Failed to save walk: ${saveError.message}`);
      }

      setCurrentSession({ ...newSession, id: data.id });
      setBreadcrumbTrail([[userLocation.longitude, userLocation.latitude]]);
      setMoments([]);
      setWalkState('active');

      startLiveStatsTracking();

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start walk");
    } finally {
      setIsLoading(false);
    }
  }, [userId, userLocation, generatedRoute]);

  const pauseWalk = useCallback(async () => {
    if (walkState !== 'active') return;
    
    setWalkState('paused');
    pausedDuration.current += Date.now() - startTime.current;
    stopLiveStatsTracking();

    // Update in Supabase
    if (currentSession?.id) {
      try {
        await supabase
          .from('walks_enhanced')
          .update({ status: 'paused' })
          .eq('id', currentSession.id);
      } catch (err) {
        console.error('Failed to update walk status:', err);
      }
    }
  }, [walkState, currentSession]);

  const resumeWalk = useCallback(async () => {
    if (walkState !== 'paused') return;
    
    setWalkState('active');
    startTime.current = Date.now();
    startLiveStatsTracking();

    // Update in Supabase
    if (currentSession?.id) {
      try {
        await supabase
          .from('walks_enhanced')
          .update({ status: 'active' })
          .eq('id', currentSession.id);
      } catch (err) {
        console.error('Failed to update walk status:', err);
      }
    }
  }, [walkState, currentSession]);

  const endWalk = useCallback(async () => {
    if (!currentSession) return;

    setIsLoading(true);
    stopLiveStatsTracking();

    try {
      const endTime = Date.now();
      const totalDuration = walkState === 'paused' 
        ? pausedDuration.current 
        : endTime - startTime.current + pausedDuration.current;

      const finalSession: WalkSession = {
        ...currentSession,
        end_time: endTime,
        total_duration: Math.floor(totalDuration / 1000),
        total_distance: liveStats.distance,
        route_path: breadcrumbTrail,
        moments,
        status: 'completed'
      };

      // Update in Supabase
      if (currentSession.id) {
        await supabase
          .from('walks_enhanced')
          .update({
            end_time: new Date(endTime).toISOString(),
            total_duration: finalSession.total_duration,
            total_distance: finalSession.total_distance,
            route_path: finalSession.route_path,
            status: 'completed'
          })
          .eq('id', currentSession.id);

        // Save moments
        if (moments.length > 0) {
          const momentInserts = moments.map(moment => ({
            walk_id: currentSession.id,
            latitude: moment.lat,
            longitude: moment.lng,
            photo_url: moment.photo_url,
            description: moment.description,
            created_at: new Date(moment.timestamp).toISOString()
          }));

          await supabase
            .from('walk_moments')
            .insert(momentInserts);
        }
      }

      setCurrentSession(finalSession);
      setWalkState('completed');

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save walk");
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, walkState, liveStats, breadcrumbTrail, moments]);

  const addMoment = useCallback((location: { lat: number; lng: number }, description?: string) => {
    if (walkState !== 'active') return;

    const newMoment: WalkMoment = {
      id: `moment_${Date.now()}`,
      lat: location.lat,
      lng: location.lng,
      timestamp: Date.now(),
      description
    };

    setMoments(prev => [...prev, newMoment]);
  }, [walkState]);

  const handleLocationUpdate = useCallback((coords: GeolocationCoordinates) => {
    setUserLocation(coords);

    if (walkState === 'active' && currentSession) {
      const newPoint: mapboxgl.LngLatLike = [coords.longitude, coords.latitude];
      
      setBreadcrumbTrail(prev => {
        if (prev.length === 0) return [newPoint];
        
        const lastPoint = prev[prev.length - 1];
        const lastLng = Array.isArray(lastPoint) ? lastPoint[0] : lastPoint.lng;
        const lastLat = Array.isArray(lastPoint) ? lastPoint[1] : lastPoint.lat;
        
        const distance = calculateDistance(
          { lat: lastLat, lng: lastLng },
          { lat: coords.latitude, lng: coords.longitude }
        );
        
        if (distance > 5) {
          return [...prev, newPoint];
        }
        
        return prev;
      });
    }
  }, [walkState, currentSession]);

  const startLiveStatsTracking = useCallback(() => {
    statsInterval.current = setInterval(() => {
      if (walkState !== 'active' || !currentSession) return;

      const now = Date.now();
      const duration = Math.floor((now - startTime.current + pausedDuration.current) / 1000);
      const distance = calculateTrailDistance(breadcrumbTrail);
      const pace = duration > 0 ? distance / (duration / 60) : 0;
      const speed = pace * 0.06;

      setLiveStats({ duration, distance, pace, speed });
    }, 1000);
  }, [walkState, currentSession, breadcrumbTrail]);

  const stopLiveStatsTracking = useCallback(() => {
    if (statsInterval.current) {
      clearInterval(statsInterval.current);
      statsInterval.current = null;
    }
  }, []);

  const resetSession = useCallback(() => {
    setWalkState('idle');
    setCurrentSession(null);
    setGeneratedRoute(null);
    setBreadcrumbTrail([]);
    setMoments([]);
    setLiveStats({ duration: 0, distance: 0, pace: 0, speed: 0 });
    setError(null);
    stopLiveStatsTracking();
  }, [stopLiveStatsTracking]);

  useEffect(() => {
    return () => stopLiveStatsTracking();
  }, [stopLiveStatsTracking]);

  return {
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
    isTracking: walkState === 'active',
    hasActiveSession: currentSession !== null,
    canStartWalk: walkState === 'preview' || walkState === 'idle'
  };
}

function calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
  const R = 6371e3;
  const φ1 = point1.lat * Math.PI / 180;
  const φ2 = point2.lat * Math.PI / 180;
  const Δφ = (point2.lat - point1.lat) * Math.PI / 180;
  const Δλ = (point2.lng - point1.lng) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function calculateTrailDistance(trail: mapboxgl.LngLatLike[]): number {
  if (trail.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < trail.length; i++) {
    const prev = trail[i - 1];
    const curr = trail[i];
    
    const prevLng = Array.isArray(prev) ? prev[0] : prev.lng;
    const prevLat = Array.isArray(prev) ? prev[1] : prev.lat;
    const currLng = Array.isArray(curr) ? curr[0] : curr.lng;
    const currLat = Array.isArray(curr) ? curr[1] : curr.lat;
    
    totalDistance += calculateDistance(
      { lat: prevLat, lng: prevLng },
      { lat: currLat, lng: currLng }
    );
  }
  
  return totalDistance;
} 