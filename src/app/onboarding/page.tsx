
"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, BarChart, Star } from "lucide-react";

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useToast } from "@/hooks/use-toast";
import { SubscriptionDialog } from "@/components/subscription-dialog";

export default function OnboardingPage() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const router = useRouter();
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = React.useState(false);


  React.useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap() + 1);

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  const handleLocationRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          toast({
            title: "Success!",
            description: "Location access granted.",
          });
        },
        () => {
          toast({
            title: "Error",
            description: "Location access denied. You can enable it later in settings.",
            variant: "destructive",
          });
        }
      );
    }
  };

  React.useEffect(() => {
    handleLocationRequest();
  }, [])


  return (
    <>
      <SubscriptionDialog open={isDialogOpen} onOpenChange={setDialogOpen} />
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
        <Carousel setApi={setApi} className="w-full max-w-md">
          <CarouselContent>
            <CarouselItem>
              <Card className="bg-card border-none shadow-none">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center aspect-square">
                  <div className="p-4 rounded-full bg-primary/10 text-primary">
                    <MapPin className="w-16 h-16" />
                  </div>
                  <h2 className="mt-6 text-3xl font-bold font-headline text-foreground">
                    Welcome to Walkly
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Discover new paths, rediscover your city, and fall in love with walking.
                  </p>
                  <Image src="https://placehold.co/600x400.png" data-ai-hint="walking path" alt="Illustration of a scenic walking path" width={300} height={200} className="mt-8 rounded-lg" />
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem>
              <Card className="bg-card border-none shadow-none">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center aspect-square">
                  <div className="p-4 rounded-full bg-primary/10 text-primary">
                    <BarChart className="w-16 h-16" />
                  </div>
                  <h2 className="mt-6 text-3xl font-bold font-headline text-foreground">
                    Smart Routes & Tracking
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Generate intelligent walking routes and track your progress with detailed stats.
                  </p>
                  <Image src="https://placehold.co/600x400.png" data-ai-hint="map interface" alt="Illustration of a map interface on a phone" width={300} height={200} className="mt-8 rounded-lg" />
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem>
              <Card className="bg-card border-none shadow-none">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center aspect-square">
                  <div className="p-4 rounded-full bg-primary/10 text-primary">
                    <Star className="w-16 h-16" />
                  </div>
                  <h2 className="mt-6 text-3xl font-bold font-headline text-foreground">
                    Unlock Your Potential
                  </h2>
                  <p className="mt-2 text-muted-foreground">
                    Start a free trial for full access, or continue with our basic plan.
                  </p>
                  <div className="mt-8 space-y-4 w-full">
                    <Button className="w-full" size="lg" onClick={() => setDialogOpen(true)}>
                      <Star className="mr-2 h-4 w-4" />
                      Start 7-Day Free Trial
                    </Button>
                    <Button variant="secondary" className="w-full" size="lg" onClick={() => router.push('/login')}>
                      Continue with Free Plan
                    </Button>
                  </div>
                   <div className="mt-8">
                     <ThemeToggle />
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
        <div className="py-2 text-center text-sm text-muted-foreground">
          Slide {current} of 3
        </div>
      </div>
    </>
  );
}
