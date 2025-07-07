"use client";

import * as React from "react";
import Image from "next/image";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, Compass, Save, Clock, Camera, Pause, Play, Square, RotateCcw, Footprints } from "lucide-react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { WalkingAnimation } from "@/components/walking-animation";

type WalkState = 'idle' | 'generating' | 'preview' | 'active' | 'paused';

const MapPlaceholder = () => (
  <div className="rounded-lg bg-muted flex flex-col items-center justify-center text-center p-6 h-full">
    <AlertCircle className="w-16 h-16 text-muted-foreground mb-6" />
    <h3 className="font-bold text-xl text-foreground mb-2">Map Unavailable</h3>
    <p className="text-muted-foreground text-sm max-w-xs">
      Please provide a Google Maps API key in your environment variables to display the map.
    </p>
    <code className="text-xs bg-secondary text-secondary-foreground rounded p-3 mt-6 block">
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
    </code>
  </div>
);

function MapPageContent() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [walkState, setWalkState] = React.useState<WalkState>('idle');
  const [duration, setDuration] = React.useState(30);
  const [isGenerateSheetOpen, setGenerateSheetOpen] = React.useState(false);
  const [isMomentSheetOpen, setMomentSheetOpen] = React.useState(false);

  const handleStartWalk = React.useCallback(() => {
    setWalkState('active');
    setGenerateSheetOpen(false);
  }, []);

  React.useEffect(() => {
    const generate = searchParams.get('generate');
    const quickWalk = searchParams.get('quick_walk');

    if (generate === 'true') {
      setGenerateSheetOpen(true);
    } else if (quickWalk === 'true') {
      handleStartWalk();
    }
  }, [searchParams, handleStartWalk]);

  const handleGenerateRoute = () => {
    setGenerateSheetOpen(false);
    setWalkState('generating');
    setTimeout(() => {
      setWalkState('preview');
    }, 2000); // Simulate API call
  };

  const handleEndWalk = () => {
    setWalkState('idle');
    toast({
      title: "Walk Saved!",
      description: "Your adventure has been added to your history.",
    });
  }

  const handleSaveMoment = () => {
    setMomentSheetOpen(false);
    toast({
        title: "Moment Saved!",
        description: "Your memory has been captured on the walk.",
    });
  }

  const renderControls = () => {
    switch (walkState) {
      case 'generating':
        return (
          <Card className="shadow-2xl bg-background/95 backdrop-blur-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Generating Route...</CardTitle>
              <CardDescription>Our AI is finding the perfect path for you.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8 pt-0">
              <WalkingAnimation />
              <p className="mt-6 text-sm text-muted-foreground animate-pulse">Finding the best route...</p>
            </CardContent>
          </Card>
        );
      case 'preview':
        return (
          <Card className="shadow-2xl bg-background/95 backdrop-blur-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Your Route is Ready!</CardTitle>
              <CardDescription>{`A scenic ${duration}-minute walk.`}</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" onClick={() => setWalkState('idle')} className="app-button text-base font-semibold">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button onClick={handleStartWalk} className="app-button text-base font-semibold">
                  <Play className="mr-2 h-4 w-4" />
                  Start Walk
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case 'active':
      case 'paused':
        return (
          <Card className="shadow-2xl bg-background/95 backdrop-blur-lg border-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Current Walk</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center justify-around mb-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">1.2 km</p>
                  <p className="text-sm text-muted-foreground">Distance</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">18:32</p>
                  <p className="text-sm text-muted-foreground">Time</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                 <Button size="lg" variant="secondary" onClick={() => setWalkState(walkState === 'active' ? 'paused' : 'active')} className="app-button">
                  {walkState === 'active' ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button size="lg" variant="secondary" onClick={() => setMomentSheetOpen(true)} className="app-button">
                  <Camera className="h-5 w-5" />
                </Button>
                 <Button size="lg" variant="destructive" onClick={handleEndWalk} className="app-button">
                  <Square className="h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      case 'idle':
      default:
        return (
          <div className="grid grid-cols-1 gap-4">
             <Button size="lg" onClick={() => setGenerateSheetOpen(true)} className="app-button text-base font-semibold shadow-lg">
              <Compass className="mr-2 h-5 w-5" />
              Generate Smart Route
            </Button>
          </div>
        );
    }
  };
  
  return (
    <AppLayout>
      <div className="relative flex h-full w-full overflow-hidden">
        <div className="absolute inset-0">
          {apiKey ? (
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={{ lat: 51.5072, lng: -0.1276 }}
                defaultZoom={12}
                gestureHandling={"greedy"}
                disableDefaultUI={true}
                mapId="walkly_map"
                className="w-full h-full"
              />
            </APIProvider>
          ) : (
            <MapPlaceholder />
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 safe-area-bottom">
          {renderControls()}
        </div>

        <Sheet open={isGenerateSheetOpen} onOpenChange={setGenerateSheetOpen}>
          <SheetContent className="native-scroll">
            <SheetHeader>
              <SheetTitle className="text-xl">Generate a new walk</SheetTitle>
              <SheetDescription>
                Let our AI create a custom walking route just for you. How long would you like to walk for?
              </SheetDescription>
            </SheetHeader>
            <div className="py-8 space-y-8">
              <div className="space-y-6">
                <Label htmlFor="duration" className="text-2xl font-bold text-center block text-primary">
                  {duration} minutes
                </Label>
                <Slider
                  id="duration"
                  min={10}
                  max={120}
                  step={5}
                  value={[duration]}
                  onValueChange={(value) => setDuration(value[0])}
                  className="touch-slider"
                />
              </div>
              <Button size="lg" className="w-full app-button text-base font-semibold" onClick={handleGenerateRoute}>
                <Compass className="mr-2 h-5 w-5" />
                Generate Smart Route
              </Button>
              <Button size="lg" variant="secondary" className="w-full app-button text-base font-semibold" onClick={handleStartWalk}>
                <Footprints className="mr-2 h-5 w-5" />
                Just Start Walking
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        <Sheet open={isMomentSheetOpen} onOpenChange={setMomentSheetOpen}>
          <SheetContent className="native-scroll">
            <SheetHeader>
              <SheetTitle className="text-xl">Capture a Moment</SheetTitle>
              <SheetDescription>
                Add a photo and a note to remember this spot.
              </SheetDescription>
            </SheetHeader>
            <div className="py-8 space-y-6">
              <div className="space-y-3">
                <Label className="text-base font-medium">Photo</Label>
                <Card interactive>
                  <CardContent className="p-3 aspect-video flex items-center justify-center bg-secondary">
                      <Image src="https://placehold.co/600x400.png" alt="Photo placeholder" width={300} height={150} className="rounded-md object-cover" data-ai-hint="nature landscape" />
                  </CardContent>
                </Card>
                <Button variant="outline" className="w-full app-button text-base font-semibold">
                    <Camera className="mr-2 h-4 w-4" />
                    Upload Photo
                </Button>
              </div>
              <div className="space-y-3">
                <Label htmlFor="note" className="text-base font-medium">Note (Optional)</Label>
                <Textarea id="note" placeholder="What's special about this place?" rows={4} className="app-input text-base resize-none" />
              </div>
              <Button size="lg" className="w-full app-button text-base font-semibold" onClick={handleSaveMoment}>
                <Save className="mr-2 h-5 w-5" />
                Save Moment
              </Button>
            </div>
          </SheetContent>
        </Sheet>

      </div>
    </AppLayout>
  );
}


export default function MapPage() {
  return (
    <React.Suspense fallback={<div className="h-full w-full bg-background" />}>
      <MapPageContent />
    </React.Suspense>
  )
}
