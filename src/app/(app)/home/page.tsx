
"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Compass, Footprints, Activity } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import * as React from 'react';

const ActivityHeatmap = () => {
  const [days, setDays] = React.useState<Array<{ date: string; count: number }>>([]);

  React.useEffect(() => {
    // Generate data for the last 12 weeks
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 83); // 12 weeks * 7 days - 1

    const generatedDays = [];
    let day = new Date(startDate);
    while (day <= endDate) {
      generatedDays.push({
        date: day.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 5),
      });
      day.setDate(day.getDate() + 1);
    }
    setDays(generatedDays);
  }, []);
  
  const getColor = (count: number) => {
    if (count === 0) return 'bg-muted/50';
    if (count <= 1) return 'bg-primary/20';
    if (count <= 2) return 'bg-primary/40';
    if (count <= 3) return 'bg-primary/60';
    return 'bg-primary';
  };
  
  if (!days.length) {
    return null; // Or a loading skeleton
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
                <p>{d.count} walks on {new Date(d.date).toLocaleDateString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
}


export default function HomePage() {
  const walksThisWeek = 5;
  const lastWalk = {
    distance: "3.2 km",
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-8">
        <header>
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Good morning, Alex!
          </h1>
          <p className="text-muted-foreground">Ready for a new adventure?</p>
        </header>

        <Card className="shadow-lg bg-primary/10 border-primary/20">
          <CardHeader>
            <CardTitle>Time for a walk?</CardTitle>
            <CardDescription>The weather is perfect today. Let's find a new path for you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/map?generate=true" passHref>
              <Button size="lg" className="w-full">
                <Compass className="mr-2 h-5 w-5" />
                Generate a Smart Route
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="shadow-md">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Walks This Week</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-bold">{walksThisWeek}</p>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Last Walk</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <p className="text-3xl font-bold">{lastWalk.distance}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-primary" />
              <span>Your Activity</span>
            </CardTitle>
            <CardDescription>A look at your walks over the last 12 weeks.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap />
          </CardContent>
        </Card>

        <Link href="/map?quick_walk=true" passHref>
            <Button size="lg" variant="secondary" className="w-full">
                <Footprints className="mr-2 h-5 w-5" />
                Start a Quick Walk
            </Button>
        </Link>
      </div>
    </AppLayout>
  );
}
