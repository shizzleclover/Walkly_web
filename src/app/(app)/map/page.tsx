
"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Compass, Save, Clock } from "lucide-react";
import { APIProvider, Map } from "@vis.gl/react-google-maps";

const MapPlaceholder = () => (
  <div className="rounded-lg bg-muted flex flex-col items-center justify-center text-center p-4 h-full">
    <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
    <h3 className="font-bold text-lg text-foreground">Map Unavailable</h3>
    <p className="text-muted-foreground text-sm">
      Please provide a Google Maps API key in your environment variables to display the map.
    </p>
    <code className="text-xs bg-secondary text-secondary-foreground rounded p-2 mt-4">
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
    </code>
  </div>
);

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <AppLayout>
      <div className="relative h-full w-full">
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

        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4">
          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle>Current Walk</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-2xl font-bold">1.2 km</p>
                <p className="text-sm text-muted-foreground">Distance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">18:32</p>
                <p className="text-sm text-muted-foreground">Time</p>
              </div>
            </CardContent>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Button size="lg" variant="secondary">
              <Compass className="mr-2 h-5 w-5" />
              New Route
            </Button>
            <Button size="lg">
              <Save className="mr-2 h-5 w-5" />
              Save Walk
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
