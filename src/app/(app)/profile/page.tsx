"use client";

import * as React from "react";
import { AppLayout } from "@/components/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart as BarChartIcon, Settings, User, Star, MapPin, Clock, Target, TrendingUp, Activity, Calendar, Award, Zap } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line, Area, AreaChart } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useAuthState } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { WalkingAnimation } from "@/components/walking-animation";

interface WalkStats {
  totalWalks: number;
  totalDistance: number;
  totalDuration: number;
  thisWeekWalks: number;
  thisMonthWalks: number;
  averageDistance: number;
  longestWalk: number;
  currentStreak: number;
}

interface MonthlyWalkData {
  month: string;
  walks: number;
  distance: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  maxProgress?: number;
}

const chartConfig = {
  walks: {
    label: "Walks",
    color: "hsl(var(--primary))",
  },
  distance: {
    label: "Distance (km)",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig;

function WalkChart({ data }: { data: MonthlyWalkData[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-center">
        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No walking data yet</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Start your first walk to see your progress here!
        </p>
        <Link href="/map?generate=true">
          <Button className="gap-2">
            <MapPin className="h-4 w-4" />
            Start Walking
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={data} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorWalks" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-walks)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--color-walks)" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Area 
            dataKey="walks" 
            stroke="var(--color-walks)" 
            fillOpacity={1} 
            fill="url(#colorWalks)" 
            strokeWidth={2}
            animationDuration={900} 
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

function StatCard({ icon: Icon, title, value, description, trend }: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  description: string;
  trend?: { value: number; label: string };
}) {
  return (
    <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">{title}</h3>
            </div>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-500 font-medium">+{trend.value}% {trend.label}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AchievementCard({ achievement }: { achievement: Achievement }) {
  return (
    <Card className={`relative overflow-hidden transition-all duration-300 ${
      achievement.unlocked 
        ? 'bg-gradient-to-br from-primary/5 to-background border-primary/20 shadow-md' 
        : 'opacity-60 border-dashed'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${
            achievement.unlocked ? 'bg-primary/10' : 'bg-muted'
          }`}>
            <Award className={`h-5 w-5 ${
              achievement.unlocked ? 'text-primary' : 'text-muted-foreground'
            }`} />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{achievement.title}</h4>
            <p className="text-xs text-muted-foreground">{achievement.description}</p>
            {achievement.progress !== undefined && achievement.maxProgress && (
              <div className="mt-2">
                <Progress 
                  value={(achievement.progress / achievement.maxProgress) * 100} 
                  className="h-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {achievement.progress}/{achievement.maxProgress}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyStateCard({ title, description, actionText, actionHref, icon: Icon }: {
  title: string;
  description: string;
  actionText: string;
  actionHref: string;
  icon: React.ElementType;
}) {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/10">
      <CardContent className="p-8 text-center">
        <div className="flex flex-col items-center">
          <Icon className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">{description}</p>
          <Link href={actionHref}>
            <Button className="gap-2">
              <Zap className="h-4 w-4" />
              {actionText}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProfilePage() {
  const { user, profile, hasPremiumAccess, isOnTrial, daysLeftInTrial } = useAuthState();
  const [walkStats, setWalkStats] = React.useState<WalkStats | null>(null);
  const [monthlyData, setMonthlyData] = React.useState<MonthlyWalkData[]>([]);
  const [achievements, setAchievements] = React.useState<Achievement[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchUserData() {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        // Fetch walk statistics
        const { data: walks, error: walksError } = await supabase
          .from('walks')
          .select('*')
          .eq('user_id', user.id);

        if (walksError) {
          console.error('Error fetching walks:', walksError);
          setWalkStats({
            totalWalks: 0,
            totalDistance: 0,
            totalDuration: 0,
            thisWeekWalks: 0,
            thisMonthWalks: 0,
            averageDistance: 0,
            longestWalk: 0,
            currentStreak: 0
          });
          setMonthlyData([]);
        } else {
          // Calculate statistics
          const now = new Date();
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

          const totalWalks = walks?.length || 0;
          const totalDistance = walks?.reduce((sum, walk) => sum + (Number(walk.distance) || 0), 0) || 0;
          const totalDuration = walks?.reduce((sum, walk) => sum + (Number(walk.duration) || 0), 0) || 0;
          const thisWeekWalks = walks?.filter(walk => new Date(walk.created_at as string) >= weekAgo).length || 0;
          const thisMonthWalks = walks?.filter(walk => new Date(walk.created_at as string) >= monthAgo).length || 0;
          const averageDistance = totalWalks > 0 ? totalDistance / totalWalks : 0;
          const longestWalk = walks?.reduce((max, walk) => Math.max(max, Number(walk.distance) || 0), 0) || 0;

          setWalkStats({
            totalWalks,
            totalDistance,
            totalDuration,
            thisWeekWalks,
            thisMonthWalks,
            averageDistance,
            longestWalk,
            currentStreak: thisWeekWalks
          });

          // Generate monthly data for chart
          const monthlyWalkData: MonthlyWalkData[] = [];
          for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const monthWalks = walks?.filter(walk => {
              const walkDate = new Date(walk.created_at as string);
              return walkDate >= monthStart && walkDate <= monthEnd;
            }) || [];

            monthlyWalkData.push({
              month: date.toLocaleString('default', { month: 'long' }),
              walks: monthWalks.length,
              distance: monthWalks.reduce((sum, walk) => sum + (Number(walk.distance) || 0), 0)
            });
          }
          setMonthlyData(monthlyWalkData);
        }

        // Generate achievements based on stats
        const generatedAchievements: Achievement[] = [
          {
            id: '1',
            title: 'First Steps',
            description: 'Complete your first walk',
            icon: '🚶',
            unlocked: (walks?.length || 0) > 0
          },
          {
            id: '2',
            title: 'Early Bird',
            description: 'Walk 5 times',
            icon: '🌅',
            unlocked: (walks?.length || 0) >= 5,
            progress: Math.min(walks?.length || 0, 5),
            maxProgress: 5
          },
          {
            id: '3',
            title: 'Distance Master',
            description: 'Walk a total of 10km',
            icon: '🏃',
            unlocked: totalDistance >= 10,
            progress: Math.min(totalDistance, 10),
            maxProgress: 10
          },
          {
            id: '4',
            title: 'Consistency King',
            description: 'Walk 3 times this week',
            icon: '👑',
            unlocked: thisWeekWalks >= 3,
            progress: Math.min(thisWeekWalks, 3),
            maxProgress: 3
          }
        ];
        setAchievements(generatedAchievements);

      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [user?.id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col h-full">
          <header className="p-4 sm:p-6 flex justify-between items-center sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b safe-area-top">
            <div>
              <h1 className="text-3xl font-bold font-headline text-foreground">Profile</h1>
              <p className="text-muted-foreground mt-1">Your walking journey</p>
            </div>
            <Link href="/profile/settings" passHref>
              <Button variant="ghost" size="icon" className="app-button">
                <Settings className="h-6 w-6" />
              </Button>
            </Link>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <WalkingAnimation className="h-12 w-12" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const hasWalkData = walkStats && walkStats.totalWalks > 0;

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="p-4 sm:p-6 flex justify-between items-center sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b safe-area-top">
          <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">
              {profile?.username ? `Hey, ${profile.username}!` : 'Profile'}
            </h1>
            <p className="text-muted-foreground mt-1">Your walking journey</p>
          </div>
          <Link href="/profile/settings" passHref>
            <Button variant="ghost" size="icon" className="app-button">
              <Settings className="h-6 w-6" />
            </Button>
          </Link>
        </header>

        <ScrollArea className="flex-1 native-scroll">
          <div className="p-4 sm:p-6 space-y-6">
            {/* Subscription Status */}
            {isOnTrial && (
              <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20 shadow-md">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Free Trial</h3>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {daysLeftInTrial} days left
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Enjoying full access during your trial period.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Profile Overview */}
            <Card className="shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 ring-4 ring-primary/10 ring-offset-2 ring-offset-background">
                    <AvatarImage src={profile?.avatar_url} alt="User avatar" />
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground">
                      {profile?.username || 'Walker'}
                    </h2>
                    <p className="text-muted-foreground">{user?.email}</p>
                    {hasPremiumAccess && (
                      <Badge className="mt-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black">
                        <Star className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {hasWalkData ? (
              <>
                {/* Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    icon={Activity}
                    title="Total Walks"
                    value={walkStats.totalWalks}
                    description="walks completed"
                    trend={{ value: 12, label: "this month" }}
                  />
                  <StatCard
                    icon={MapPin}
                    title="Distance"
                    value={`${walkStats.totalDistance.toFixed(1)}km`}
                    description="total distance"
                  />
                  <StatCard
                    icon={Clock}
                    title="Time"
                    value={`${Math.round(walkStats.totalDuration / 60)}min`}
                    description="total time walking"
                  />
                  <StatCard
                    icon={Target}
                    title="This Week"
                    value={walkStats.thisWeekWalks}
                    description="walks this week"
                  />
                </div>

                {/* Activity Chart */}
                <Card className="shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <BarChartIcon className="w-5 h-5 text-primary" />
                      <span>Activity Trends</span>
                    </CardTitle>
                    <CardDescription>Your walking activity over the last 6 months</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <WalkChart data={monthlyData} />
                  </CardContent>
                </Card>

                {/* Achievements */}
                <Card className="shadow-md">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Award className="w-5 h-5 text-primary" />
                      <span>Achievements</span>
                    </CardTitle>
                    <CardDescription>Track your walking milestones</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {achievements.map((achievement) => (
                        <AchievementCard key={achievement.id} achievement={achievement} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              /* Empty State - No Walk Data */
              <div className="space-y-6">
                <EmptyStateCard
                  title="Start Your Walking Journey"
                  description="Take your first walk to begin tracking your progress and unlock achievements!"
                  actionText="Generate a Route"
                  actionHref="/map?generate=true"
                  icon={MapPin}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="border-dashed border-2 border-muted-foreground/20">
                    <CardContent className="p-6 text-center">
                      <Activity className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">Track Progress</h3>
                      <p className="text-sm text-muted-foreground">
                        Monitor your distance, time, and walking streaks
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-dashed border-2 border-muted-foreground/20">
                    <CardContent className="p-6 text-center">
                      <Award className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-semibold mb-1">Earn Achievements</h3>
                      <p className="text-sm text-muted-foreground">
                        Unlock badges and milestones as you walk
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Weekly Challenge</h3>
                        <p className="text-muted-foreground text-sm mb-3">
                          Complete 3 walks this week to earn your first achievement!
                        </p>
                        <Progress value={0} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">0/3 walks completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
