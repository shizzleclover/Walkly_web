"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, BarChart, Star, Check } from "lucide-react";

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
                  <Image src="/walking-direction.svg" alt="Illustration of a person walking towards their destination" width={300} height={200} className="mt-8" />
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
                  <Image src="/adventure-map.svg" alt="Illustration of a person exploring with a map and planning adventures" width={300} height={200} className="mt-8" />
                </CardContent>
              </Card>
            </CarouselItem>
            <CarouselItem>
              <Card className="bg-card border-none shadow-none">
                <CardContent className="flex flex-col items-center justify-center p-6 text-center aspect-[9/12] sm:aspect-square">
                  <div className="p-4 rounded-full bg-primary/10 text-primary">
                    <Star className="w-12 h-12 sm:w-16 sm:h-16" />
                  </div>
                  <h2 className="mt-6 text-2xl sm:text-3xl font-bold font-headline text-foreground">
                    Ready to Go Premium?
                  </h2>
                  <p className="mt-2 text-muted-foreground max-w-sm">
                    Unlock all features for 7 days. No commitment, cancel anytime.
                  </p>
                  
                  <ul className="mt-6 sm:mt-8 space-y-2 text-left text-sm text-foreground">
                    <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Unlimited AI-Generated Walks</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Capture & Save Unlimited Moments</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span>Full, Unrestricted Walk History</span>
                    </li>
                  </ul>
            
                  <div className="mt-auto pt-6 w-full space-y-2">
                    <Button className="w-full" size="lg" onClick={() => setDialogOpen(true)}>
                      <Star className="mr-2 h-4 w-4 animate-subtle-pulse" />
                      Start 7-Day Free Trial
                    </Button>
                    <Button variant="link" className="text-muted-foreground" size="lg" onClick={() => router.push('/login')}>
                      Maybe Later
                    </Button>
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
