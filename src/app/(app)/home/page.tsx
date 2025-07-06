
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Compass, Footprints, Clock } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const walksThisWeek = 5;
  const lastWalk = {
    distance: "3.2 km",
    duration: "45 min",
    date: "Yesterday",
  };

  return (
    <AppLayout>
      <div className="p-4 sm:p-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Good morning!
          </h1>
          <p className="text-muted-foreground">Ready for a new adventure?</p>
        </header>

        <div className="grid gap-6">
          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart className="w-5 h-5 text-primary" />
                <span>Weekly Progress</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-foreground">{walksThisWeek}</p>
              <p className="text-sm text-muted-foreground">Walks this week</p>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Footprints className="w-5 h-5 text-primary" />
                <span>Last Walk</span>
              </CardTitle>
              <CardDescription>{lastWalk.date}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{lastWalk.distance}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{lastWalk.duration}</span>
              </div>
            </CardContent>
          </Card>

          <div className="mt-4 space-y-4">
            <Link href="/map" passHref>
              <Button size="lg" className="w-full">
                <Compass className="mr-2 h-5 w-5" />
                Generate New Walk
              </Button>
            </Link>
            <Link href="/map" passHref>
              <Button size="lg" variant="secondary" className="w-full">
                <Footprints className="mr-2 h-5 w-5" />
                Start a Quick Walk
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
