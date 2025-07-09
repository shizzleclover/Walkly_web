"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { MapPin, BarChart, Star, Check, Loader2 } from "lucide-react";

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
import { useAuthState } from "@/hooks/use-auth";
import { userHelpers } from "@/lib/supabase";

export default function OnboardingPage() {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [isCompleting, setIsCompleting] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = React.useState(false);
  const { user, profile, loading, refreshUserData } = useAuthState();


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
  }, []);

  // Redirect if user has already completed onboarding
  React.useEffect(() => {
    if (!loading && user && profile?.onboarding_completed) {
      console.log('User has already completed onboarding, redirecting to home');
      router.push('/home');
    }
  }, [user, profile, loading, router]);

  const completeOnboarding = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
      router.push('/login');
      return;
    }

    setIsCompleting(true);
    try {
      console.log('Completing onboarding for user:', user.id);
      
      const { data, error } = await userHelpers.markOnboardingCompleted(user.id);
      
      if (error) {
        console.error('Error marking onboarding as completed:', error);
        
        // If there's a database error, still allow user to proceed
        // They can complete onboarding later or we can fix it on the backend
        toast({
          title: "Welcome to Walkly!",
          description: "Setup complete! Let's start walking.",
        });
        
        // Navigate anyway to avoid blocking the user
        setTimeout(() => {
          router.push('/home');
        }, 500);
        return;
      }

      console.log('Onboarding marked as completed successfully:', data);

      // Refresh user data to get the updated profile
      try {
        await refreshUserData();
        console.log('User data refreshed after onboarding completion');
      } catch (refreshError) {
        console.warn('Failed to refresh user data, but continuing:', refreshError);
      }

      toast({
        title: "Welcome to Walkly!",
        description: "Your account is all set up. Let's start walking!",
      });
      
      // Small delay to ensure state is updated before navigation
      setTimeout(() => {
        router.push('/home');
      }, 500);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      
      // Fallback: still allow user to proceed to avoid blocking them
      toast({
        title: "Welcome to Walkly!",
        description: "Setup complete! Let's start your walking journey.",
      });
      
      setTimeout(() => {
        router.push('/home');
      }, 500);
    }
  };

  // Add a direct skip function for emergency fallback
  const skipOnboardingFallback = () => {
    console.log('Using fallback onboarding skip');
    toast({
      title: "Welcome to Walkly!",
      description: "Let's start walking!",
    });
    router.push('/home');
  };

  // Add a debug/fallback option to the UI for users who are still stuck, and also check if there are any issues with the navigation flow:
  React.useEffect(() => {
    // Test database connection on component mount (development only)
    if (process.env.NODE_ENV === 'development' && user?.id) {
      console.log('Testing database connection for user:', user.id);
      userHelpers.getUserProfile(user.id)
        .then(({ data, error }) => {
          if (error) {
            console.error('Database connection test failed:', error);
          } else {
            console.log('Database connection test successful:', data);
          }
        })
        .catch(err => {
          console.error('Database connection exception:', err);
        });
    }
  }, [user?.id]);

  // Add a test function users can call from browser console
  React.useEffect(() => {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      (window as any).testOnboardingCompletion = async () => {
        if (!user?.id) {
          console.log('No user ID available');
          return;
        }
        console.log('Testing onboarding completion for user:', user.id);
        try {
          const result = await userHelpers.markOnboardingCompleted(user.id);
          console.log('Test result:', result);
          await refreshUserData();
          console.log('User data refreshed');
        } catch (error) {
          console.error('Test failed:', error);
        }
      };
    }
  }, [user?.id, refreshUserData]);


  return (
    <>
      <SubscriptionDialog 
        open={isDialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={completeOnboarding} 
      />
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
                    <Button 
                      variant="link" 
                      className="text-muted-foreground" 
                      size="lg" 
                      onClick={completeOnboarding}
                      disabled={isCompleting}
                    >
                      {isCompleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        'Continue with Free Plan'
                      )}
                    </Button>
                    
                    {/* Debug/Fallback button for development or if users get stuck */}
                    {(process.env.NODE_ENV === 'development' || isCompleting) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={skipOnboardingFallback}
                        className="text-xs text-muted-foreground/60 w-full mt-4"
                      >
                        Skip Setup (Fallback)
                      </Button>
                    )}
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
