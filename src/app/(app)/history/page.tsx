
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Compass, Camera, Sparkles } from "lucide-react";
import Image from "next/image";

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
  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="p-4 sm:p-6 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Walk History
          </h1>
          <p className="text-muted-foreground">A log of your recent adventures.</p>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6 space-y-6">
            {displayedWalks.map((walk) => (
              <Card key={walk.id} className="shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                <CardContent className="p-0">
                  <Image 
                    src={`https://placehold.co/600x300.png`} 
                    alt={`Map of ${walk.locationName}`} 
                    data-ai-hint={walk.mapHint}
                    width={600}
                    height={300}
                    className="object-cover w-full"
                  />
                  <div className="p-4">
                    <CardTitle className="text-xl font-bold">{walk.locationName}</CardTitle>
                    <CardDescription>
                      {new Date(walk.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </CardDescription>

                    <div className="flex items-center justify-start gap-6 mt-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Compass className="w-4 h-4 text-primary" />
                        <span className="font-medium">{walk.distance}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium">{walk.duration}</span>
                      </div>
                    </div>
                  </div>

                  {walk.moments.length > 0 && (
                    <div className="px-4 pb-4">
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                          <Camera className="w-4 h-4 text-muted-foreground" />
                          Moments Captured
                        </h4>
                        <div className="flex gap-2">
                          {walk.moments.slice(0, 4).map(moment => (
                            <Image
                              key={moment.id}
                              src={`https://placehold.co/100x100.png`} 
                              alt="Moment from walk" 
                              data-ai-hint={moment.photoHint}
                              width={100}
                              height={100}
                              className="rounded-md object-cover w-16 h-16"
                            />
                          ))}
                           {walk.moments.length > 4 && (
                            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground font-medium">
                              +{walk.moments.length - 4}
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
              <Card className="bg-primary/5 border-primary/20 text-center shadow-md">
                <CardHeader>
                  <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-2">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Unlock Your Full History</CardTitle>
                  <CardDescription>See all your past walks and captured moments by upgrading.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button>
                    Upgrade to Premium
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
