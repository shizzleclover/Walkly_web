"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass, Footprints, Activity, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import * as React from 'react';
import { useAuthState } from "@/hooks/use-auth";
import { walkHelpers, Walk } from "@/lib/supabase";
import { Skeleton } from "@/components/ui/skeleton";
import { useLoading } from "@/components/loading-provider";

interface ActivityHeatmapProps {
  walks: Walk[];
  loading?: boolean;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ walks, loading }) => {
  const [days, setDays] = React.useState<Array<{ date: string; count: number }>>([]);

  React.useEffect(() => {
    if (loading) return;
    
    // Generate data for the last 12 weeks
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 83); // 12 weeks * 7 days - 1

    const walksByDate = new Map<string, number>();
    
    // Count walks by date
    walks.forEach(walk => {
      const walkDate = new Date(walk.start_time).toISOString().split('T')[0];
      walksByDate.set(walkDate, (walksByDate.get(walkDate) || 0) + 1);
    });

    const generatedDays = [];
    let day = new Date(startDate);
    while (day <= endDate) {
      const dateString = day.toISOString().split('T')[0];
      generatedDays.push({
        date: dateString,
        count: walksByDate.get(dateString) || 0,
      });
      day.setDate(day.getDate() + 1);
    }
    setDays(generatedDays);
  }, [walks, loading]);
  
  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted/50';
    if (count <= 1) return 'bg-primary/20';
    if (count <= 2) return 'bg-primary/40';
    if (count <= 3) return 'bg-primary/60';
    return 'bg-primary';
  };
  
  if (loading) {
    return (
      <div className="flex justify-center">
        <div className="grid grid-flow-col grid-rows-7 gap-1">
          {Array.from({ length: 84 }, (_, i) => (
            <Skeleton key={i} className="h-3.5 w-3.5 rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  if (!days.length) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Activity className="mx-auto h-12 w-12 opacity-50 mb-2" />
        <p>No activity data available yet</p>
        <p className="text-sm">Start walking to see your progress here!</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center">
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {days.map((d) => (
          <TooltipProvider key={d.date} delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn("h-3.5 w-3.5 rounded-sm", getColor(d.count))} />
              </TooltipTrigger>
              <TooltipContent>
                <p>{d.count} walk{d.count !== 1 ? 's' : ''} on {new Date(d.date).toLocaleDateString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

const NewUserEngagement: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card interactive className="shadow-lg bg-gradient-to-br from-primary/10 to-background border-primary/20">
        <CardContent className="p-6 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Footprints className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Welcome to Walkly!</h3>
              <p className="text-muted-foreground mb-4">
                Ready to start your walking journey? Let's take your first step together.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
              <Link href="/map?generate=true" passHref className="flex-1">
                <Button size="lg" className="w-full text-base font-semibold">
                  <Compass className="mr-2 h-5 w-5" />
                  Smart Route
                </Button>
              </Link>
              <Link href="/map?quick_walk=true" passHref className="flex-1">
                <Button size="lg" variant="secondary" className="w-full text-base font-semibold">
                  <Footprints className="mr-2 h-5 w-5" />
                  Quick Walk
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardContent className="p-6 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h4 className="font-semibold mb-2">Track Your Progress</h4>
          <p className="text-sm text-muted-foreground">
            Once you complete your first walk, you'll see your activity stats, progress charts, and walking history here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default function HomePage() {
  const { user, profile, loading: authLoading } = useAuthState();
  const { hideLoading } = useLoading();
  const [walks, setWalks] = React.useState<Walk[]>([]);
  const [walksLoading, setWalksLoading] = React.useState(true);
  const [walksThisWeek, setWalksThisWeek] = React.useState(0);
  const [lastWalk, setLastWalk] = React.useState<Walk | null>(null);

  // Hide global loading when page data is ready
  React.useEffect(() => {
    if (!authLoading && !walksLoading && user) {
      const timer = setTimeout(() => {
        hideLoading();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [authLoading, walksLoading, user, hideLoading]);

  // Fetch user walks
  React.useEffect(() => {
    const fetchWalks = async () => {
      if (!user?.id) {
        setWalksLoading(false);
        return;
      }

      try {
        setWalksLoading(true);
        const { data, error } = await walkHelpers.getUserWalks(user.id, 100);
        
        if (error) {
          console.error('Error fetching walks:', error);
          setWalks([]);
        } else {
          setWalks(data || []);
          
          // Calculate walks this week
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week (Sunday)
          weekStart.setHours(0, 0, 0, 0);
          
          const thisWeekWalks = (data || []).filter(walk => {
            const walkDate = new Date(walk.start_time);
            return walkDate >= weekStart;
          });
          
          setWalksThisWeek(thisWeekWalks.length);
          setLastWalk((data && data.length > 0) ? data[0] : null);
        }
      } catch (error) {
        console.error('Error fetching walks:', error);
        setWalks([]);
      } finally {
        setWalksLoading(false);
      }
    };

    fetchWalks();
  }, [user?.id]);

  // Get user's display name
  const getDisplayName = () => {
    if (profile?.username) {
      return profile.username;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "there";
  };

  // Get time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Format distance
  const formatDistance = (distanceInKm?: number) => {
    if (!distanceInKm) return "0 km";
    return `${distanceInKm.toFixed(1)} km`;
  };

  // If still loading auth or user data
  if (authLoading) {
    return (
      <AppLayout>
        <div className="p-4 sm:p-6 space-y-6 safe-area-top">
          <header className="pt-2">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </header>
          <Card className="shadow-lg">
            <CardContent className="p-6">
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card className="shadow-md">
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
            <Card className="shadow-md">
              <CardContent className="p-4">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show new user engagement if no walks
  const isNewUser = !walksLoading && walks.length === 0;

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-6 safe-area-top">
        <header className="pt-2">
          <h1 className="text-3xl font-bold font-headline text-foreground">
            {getGreeting()}, {getDisplayName()}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {isNewUser ? "Ready to start your walking journey?" : "Ready for a new adventure?"}
          </p>
        </header>

        {isNewUser ? (
          <NewUserEngagement />
        ) : (
          <>
            <Card interactive className="shadow-lg bg-gradient-to-br from-primary/10 to-background border-primary/20">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Time for a walk?</CardTitle>
                <CardDescription>
                  {walksThisWeek > 0 
                    ? `You've completed ${walksThisWeek} walk${walksThisWeek !== 1 ? 's' : ''} this week. Keep it up!`
                    : "Start your week with a refreshing walk."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/map?generate=true" passHref>
                  <Button size="lg" className="w-full text-base font-semibold">
                    <Compass className="mr-2 h-5 w-5" />
                    Generate a Smart Route
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card interactive className="shadow-md">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Walks This Week
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {walksLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">{walksThisWeek}</p>
                  )}
                </CardContent>
              </Card>
              
              <Card interactive className="shadow-md">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Footprints className="h-4 w-4" />
                    Last Walk
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  {walksLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">
                      {lastWalk ? formatDistance(lastWalk.distance) : "No walks"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="w-5 h-5 text-primary" />
                  <span>Your Activity</span>
                </CardTitle>
                <CardDescription>A look at your walks over the last 12 weeks.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <ActivityHeatmap walks={walks} loading={walksLoading} />
              </CardContent>
            </Card>

            <Link href="/map?quick_walk=true" passHref>
              <Button size="lg" variant="secondary" className="w-full text-base font-semibold">
                <Footprints className="mr-2 h-5 w-5" />
                Start a Quick Walk
              </Button>
            </Link>
          </>
        )}
      </div>
    </AppLayout>
  );
}
