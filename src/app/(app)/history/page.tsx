import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Compass, Calendar } from "lucide-react";
import Image from "next/image";

const pastWalks = [
  { id: 1, distance: "5.1 km", duration: "1h 15m", date: "2024-07-20", mapHint: "city park" },
  { id: 2, distance: "2.5 km", duration: "32m", date: "2024-07-19", mapHint: "suburban neighborhood" },
  { id: 3, distance: "7.8 km", duration: "1h 45m", date: "2024-07-17", mapHint: "forest trail" },
  { id: 4, distance: "3.2 km", duration: "45m", date: "2024-07-16", mapHint: "coastal path" },
  { id: 5, distance: "1.5 km", duration: "20m", date: "2024-07-15", mapHint: "urban street" },
  { id: 6, distance: "4.0 km", duration: "55m", date: "2024-07-14", mapHint: "river walk" },
  { id: 7, distance: "6.2 km", duration: "1h 25m", date: "2024-07-12", mapHint: "mountain hike" },
];

export default function HistoryPage() {
  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="p-4 sm:p-6 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Walk History
          </h1>
          <p className="text-muted-foreground">A log of your past adventures.</p>
        </header>

        <ScrollArea className="flex-1">
          <div className="p-4 sm:p-6 space-y-4">
            {pastWalks.map((walk) => (
              <Card key={walk.id} className="shadow-md hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex">
                  <div className="w-2/3">
                    <CardHeader>
                      <CardTitle>Walk on {new Date(walk.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3"/>
                        {new Date(walk.date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                       <div className="flex items-center gap-2 text-sm">
                        <Compass className="w-4 h-4 text-primary" />
                        <span className="font-medium">{walk.distance}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="font-medium">{walk.duration}</span>
                      </div>
                    </CardContent>
                  </div>
                  <div className="w-1/3 p-2">
                     <Image 
                        src={`https://placehold.co/200x200.png`} 
                        alt={`Map of walk on ${walk.date}`} 
                        data-ai-hint={walk.mapHint}
                        width={200}
                        height={200}
                        className="rounded-md object-cover w-full h-full aspect-square"
                      />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
