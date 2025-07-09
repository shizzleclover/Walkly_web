"use client";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Clock, Compass, Camera, Sparkles, MapPin, Calendar, Plus, Upload, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import * as React from 'react';
import { useAuthState } from "@/hooks/use-auth";
import { useLoading } from "@/components/loading-provider";
import { supabase } from "@/lib/supabase";
import { uploadMomentPhoto } from "@/lib/photo-upload";
import { useToast } from "@/hooks/use-toast";

interface WalkMoment {
  id: string;
  walk_id: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  description?: string;
  created_at: string;
}

interface WalkRecord {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  total_distance: number; // in meters
  total_duration: number; // in seconds
  route_path?: any;
  planned_route?: any;
  status: 'active' | 'paused' | 'completed';
  created_at: string;
  moments: WalkMoment[];
}

function WalkCard({ walk }: { walk: WalkRecord }) {
  const { toast } = useToast();
  const { user } = useAuthState();
  const [isUploadingMoment, setIsUploadingMoment] = React.useState(false);
  const [momentDescription, setMomentDescription] = React.useState('');
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isAddMomentOpen, setIsAddMomentOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleAddMoment = async () => {
    if (!user?.id || (!selectedFile && !momentDescription.trim())) {
      toast({
        title: "Error",
        description: "Please add a photo or description for your moment.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingMoment(true);
    try {
      let photoUrl: string | undefined;

      // Upload photo if selected
      if (selectedFile) {
        const uploadResult = await uploadMomentPhoto(selectedFile, user.id, walk.id);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Failed to upload photo');
        }
        photoUrl = uploadResult.url;
      }

      // For now, use the walk's start location as moment location
      // In a real app, you'd get this from GPS or user selection
      const startLocation = walk.route_path?.[0];
      const latitude = startLocation?.lat || 0;
      const longitude = startLocation?.lng || 0;

      // Save moment to database
      const { error } = await supabase
        .from('walk_moments')
        .insert({
          walk_id: walk.id,
          latitude,
          longitude,
          photo_url: photoUrl,
          description: momentDescription.trim() || null
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Moment Added!",
        description: "Your walk moment has been saved successfully."
      });

      // Reset form and close dialog
      setMomentDescription('');
      setSelectedFile(null);
      setIsAddMomentOpen(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Trigger a refresh (in a real app, you'd update the local state)
      window.location.reload();

    } catch (error) {
      console.error('Error adding moment:', error);
      toast({
        title: "Error",
        description: "Failed to add moment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingMoment(false);
    }
  };

  return (
    <Card className="shadow-md hover:shadow-lg transition-all duration-200 overflow-hidden">
      <CardContent className="p-0">
        {/* Walk Route Preview */}
        <div className="relative">
          <div className="h-[160px] bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Route Preview</p>
              <p className="text-xs text-muted-foreground mt-1">
                {walk.route_path?.length || 0} GPS points tracked
              </p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          
          {/* Walk Status Badge */}
          <div className="absolute top-3 right-3">
            <Badge 
              variant={walk.status === 'completed' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {walk.status}
            </Badge>
          </div>
        </div>

        <div className="p-4">
          <CardTitle className="text-xl font-bold mb-1">
            {walk.title || 'Untitled Walk'}
          </CardTitle>
          <CardDescription className="mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {formatDate(walk.start_time)}
          </CardDescription>

          {walk.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {walk.description}
            </p>
          )}

          {/* Walk Stats */}
          <div className="flex items-center justify-start gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Compass className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">
                {formatDistance(walk.total_distance)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <span className="font-semibold text-foreground">
                {formatDuration(walk.total_duration)}
              </span>
            </div>
          </div>
        </div>

        {/* Moments Section */}
        <div className="px-4 pb-4">
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Camera className="w-4 h-4 text-muted-foreground" />
                Moments Captured ({walk.moments.length})
              </h4>
              
              {/* Add Moment Button */}
              <Dialog open={isAddMomentOpen} onOpenChange={setIsAddMomentOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="w-3 h-3" />
                    Add Moment
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add a Walk Moment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Photo (optional)</label>
                      <Input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="mt-1"
                      />
                      {selectedFile && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Selected: {selectedFile.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Textarea
                        value={momentDescription}
                        onChange={(e) => setMomentDescription(e.target.value)}
                        placeholder="What made this moment special?"
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAddMoment}
                        disabled={isUploadingMoment || (!selectedFile && !momentDescription.trim())}
                        className="flex-1"
                      >
                        {isUploadingMoment ? (
                          <>
                            <Upload className="w-4 h-4 mr-2 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Camera className="w-4 h-4 mr-2" />
                            Add Moment
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsAddMomentOpen(false)}
                        disabled={isUploadingMoment}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {walk.moments.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {walk.moments.map((moment) => (
                  <div key={moment.id} className="flex-shrink-0">
                    {moment.photo_url ? (
                      <div className="relative group">
                        <Image
                          src={moment.photo_url}
                          alt="Walk moment"
                          width={64}
                          height={64}
                          className="rounded-lg object-cover w-16 h-16 border-2 border-background shadow-md"
                        />
                        {moment.description && (
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center p-1">
                            <p className="text-white text-xs text-center line-clamp-2">
                              {moment.description}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center border-2 border-background shadow-md">
                        <div className="text-center">
                          <Camera className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                          {moment.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {moment.description.slice(0, 10)}...
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-2">
                  No moments captured yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Add photos and notes from your walk
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function HistoryPage() {
  const { user, loading: authLoading, hasPremiumAccess } = useAuthState();
  const { hideLoading } = useLoading();
  const [walks, setWalks] = React.useState<WalkRecord[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Hide global loading when page is ready
  React.useEffect(() => {
    if (!authLoading && !loading && user) {
      const timer = setTimeout(() => {
        hideLoading();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [authLoading, loading, user]); // Removed hideLoading from deps to prevent infinite re-renders

  React.useEffect(() => {
    async function fetchWalks() {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        // Fetch walks with their moments
        const { data: walksData, error: walksError } = await supabase
          .from('walks_enhanced')
          .select(`
            *,
            walk_moments (*)
          `)
          .eq('user_id', user.id)
          .order('start_time', { ascending: false });

        if (walksError) {
          console.error('Error fetching walks:', walksError);
          setWalks([]);
        } else {
          // Transform the data to match our interface
          const transformedWalks: WalkRecord[] = (walksData || []).map((walk) => ({
            ...walk,
            moments: walk.walk_moments || []
          }));
          setWalks(transformedWalks);
        }
      } catch (error) {
        console.error('Error fetching walks:', error);
        setWalks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchWalks();
  }, [user?.id]);

  if (loading) {
    return (
      <AppLayout>
        <div className="flex flex-col h-full">
          <header className="p-4 sm:p-6 sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b safe-area-top">
            <h1 className="text-3xl font-bold font-headline text-foreground">
              Walk History
            </h1>
            <p className="text-muted-foreground mt-1">A log of your recent adventures.</p>
          </header>
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your walk history...</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Apply free tier limit for non-premium users
  const freeTierLimit = 5;
  const displayedWalks = hasPremiumAccess ? walks : walks.slice(0, freeTierLimit);
  const hasMoreWalks = !hasPremiumAccess && walks.length > freeTierLimit;

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="p-4 sm:p-6 sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b safe-area-top">
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Walk History
          </h1>
          <p className="text-muted-foreground mt-1">
            A log of your recent adventures.
            {!hasPremiumAccess && walks.length > 0 && (
              <span className="ml-2 text-sm">
                ({Math.min(walks.length, freeTierLimit)} of {walks.length} walks shown)
              </span>
            )}
          </p>
        </header>

        <ScrollArea className="flex-1 native-scroll">
          <div className="p-4 sm:p-6 space-y-4">
            {walks.length === 0 ? (
              // Empty State
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No walks yet
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                  Start your first walk to begin building your history and capturing moments!
                </p>
                <Link href="/map">
                  <Button className="gap-2">
                    <MapPin className="w-4 h-4" />
                    Start Your First Walk
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                {displayedWalks.map((walk) => (
                  <WalkCard key={walk.id} walk={walk} />
                ))}

                {hasMoreWalks && (
                  <Card className="bg-gradient-to-br from-primary/5 to-background border-primary/20 text-center shadow-md">
                    <CardHeader className="pb-4">
                      <div className="mx-auto bg-primary/10 rounded-full p-3 w-fit mb-2">
                        <Star className="w-6 h-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">Unlock Full History & Unlimited Moments</CardTitle>
                      <CardDescription>
                        You have {walks.length - freeTierLimit} more walks in your history. 
                        Upgrade to Premium to view all your walks and add unlimited moments with photos.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <Link href="/profile/subscription" passHref>
                        <Button className="text-base font-semibold gap-2">
                          <Sparkles className="w-4 h-4" />
                          Upgrade to Premium
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
