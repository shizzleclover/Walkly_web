"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Compass, Camera, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from 'react';
import { useAuthState } from "@/hooks/use-auth";
import { useLoading } from "@/components/loading-provider";

const pastWalks = [
  { 
    id: 1, 
    locationName: "Greenwood Park",
    distance: "5.1 km", 
    duration: "1h 15m", 
    date: "2024-07-20", 
    mapHint: "city park",
    moments: [
      { id: 'm1-1', photoHint: 'park fountain' },
      { id: 'm1-2', photoHint: 'old tree' },
      { id: 'm1-3', photoHint: 'squirrel eating' },
    ] 
  },
  { 
    id: 2, 
    locationName: "Coastal Trail",
    distance: "7.8 km", 
    duration: "1h 45m", 
    date: "2024-07-19", 
    mapHint: "coastal path",
    moments: [] 
  },
  { 
    id: 3, 
    locationName: "Downtown Loop", 
    distance: "2.5 km", 
    duration: "32m", 
    date: "2024-07-17", 
    mapHint: "urban street", 
    moments: [
      { id: 'm3-1', photoHint: 'street art' },
    ] 
  },
  { 
    id: 4, 
    locationName: "Riverside Path",
    distance: "3.2 km", 
    duration: "45m", 
    date: "2024-07-16", 
    mapHint: "river walk",
    moments: [
      { id: 'm4-1', photoHint: 'bridge' },
      { id: 'm4-2', photoHint: 'ducks swimming' },
    ] 
  },
];

const freeTierLimit = 2;
const displayedWalks = pastWalks.slice(0, freeTierLimit);

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuthState();
  const { hideLoading } = useLoading();

  // Hide global loading when page is ready
  React.useEffect(() => {
    if (!authLoading && user) {
      const timer = setTimeout(() => {
        hideLoading();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, hideLoading]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="p-4 sm:p-6 sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b safe-area-top">
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Walk History
          </h1>
          <p className="text-muted-foreground mt-1">A log of your recent adventures.</p>
        </header>

        <ScrollArea className="flex-1 native-scroll">
          <div className="p-4 sm:p-6 space-y-4">
            {displayedWalks.map((walk) => (
              <Card key={walk.id} interactive className="shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative">
                    <Image 
                      src={`https://placehold.co/600x200.png`} 
                      alt={`Map of ${walk.locationName}`} 
                      data-ai-hint={walk.mapHint}
                      width={600}
                      height={200}
                      className="object-cover w-full h-[160px]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="p-4">
                    <CardTitle className="text-xl font-bold mb-1">{walk.locationName}</CardTitle>
                    <CardDescription className="mb-3">
                      {new Date(walk.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </CardDescription>

                    <div className="flex items-center justify-start gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Compass className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground">{walk.distance}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Clock className="w-4 h-4 text-primary" />
                        </div>
                        <span className="font-semibold text-foreground">{walk.duration}</span>
                      </div>
                    </div>
                  </div>

                  {walk.moments.length > 0 && (
                    <div className="px-4 pb-4">
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Camera className="w-4 h-4 text-muted-foreground" />
                          Moments Captured
                        </h4>
                        <div className="flex gap-3">
                          {walk.moments.slice(0, 3).map(moment => (
                            <Image
                              key={moment.id}
                              src={`https://placehold.co/100x100.png`} 
                              alt="Moment from walk" 
                              data-ai-hint={moment.photoHint}
                              width={100}
                              height={100}
                              className="rounded-lg object-cover w-16 h-16 border-2 border-background shadow-md"
                            />
                          ))}
                           {walk.moments.length > 3 && (
                            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground font-medium border-2 border-background shadow-md">
                              +{walk.moments.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            ))}

            {pastWalks.length > freeTierLimit && (
              <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20 text-center shadow-md">
                <CardHeader className="pb-4">
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Unlock Full History & Moments</CardTitle>
                  <CardDescription>Save unlimited walks and capture every special moment by upgrading to Premium.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Link href="/profile/subscription" passHref>
                    <Button className="text-base font-semibold">
                      <Camera className="mr-2 h-4 w-4" />
                      Upgrade to Premium
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
