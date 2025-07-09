"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  MapPin, 
  Timer, 
  Gauge, 
  Route,
  Camera,
  Settings,
  AlertCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type WalkState, type LiveStats, type WalkSession } from "@/hooks/use-walk-session";

export interface WalkSessionOverlayProps {
  walkState: WalkState;
  liveStats: LiveStats;
  currentSession: WalkSession | null;
  generatedRoute?: any;
  isLoading: boolean;
  error?: string | null;
  onGenerateRoute: (duration: number) => void;
  onStartWalk: (title?: string) => void;
  onPauseWalk: () => void;
  onResumeWalk: () => void;
  onEndWalk: () => void;
  onTryAnotherRoute: () => void;
  onAddMoment: (description?: string) => void;
  className?: string;
}

export function WalkSessionOverlay({
  walkState,
  liveStats,
  currentSession,
  generatedRoute,
  isLoading,
  error,
  onGenerateRoute,
  onStartWalk,
  onPauseWalk,
  onResumeWalk,
  onEndWalk,
  onTryAnotherRoute,
  onAddMoment,
  className = ""
}: WalkSessionOverlayProps) {
  const [selectedDuration, setSelectedDuration] = React.useState(30);
  const [customDuration, setCustomDuration] = React.useState("");
  const [isCustomDuration, setIsCustomDuration] = React.useState(false);
  const [walkTitle, setWalkTitle] = React.useState("");
  const [momentDescription, setMomentDescription] = React.useState("");
  const [showWalkDialog, setShowWalkDialog] = React.useState(false);
  const [showMomentDialog, setShowMomentDialog] = React.useState(false);
  const { toast } = useToast();

  const durations = [15, 30, 45, 60, 90];

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(2)}km`;
  };

  const formatSpeed = (kmh: number): string => {
    return `${kmh.toFixed(1)} km/h`;
  };

  const handlePresetDuration = (duration: number) => {
    setSelectedDuration(duration);
    setIsCustomDuration(false);
    setCustomDuration("");
  };

  const handleCustomDurationChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    setCustomDuration(numericValue);
    
    if (numericValue) {
      const duration = parseInt(numericValue);
      if (duration >= 5) {
        setSelectedDuration(duration);
        setIsCustomDuration(true);
      }
    }
  };

  const getEffectiveDuration = () => {
    if (isCustomDuration && customDuration) {
      const duration = parseInt(customDuration);
      return duration >= 5 ? duration : 5;
    }
    return selectedDuration;
  };

  const isGenerateDisabled = () => {
    if (isCustomDuration) {
      const duration = parseInt(customDuration);
      return !customDuration || duration < 5;
    }
    return false;
  };

  const handleGenerateRoute = () => {
    const duration = getEffectiveDuration();
    if (duration < 5) {
      toast({
        title: "Invalid Duration",
        description: "Walk duration must be at least 5 minutes.",
        variant: "destructive",
      });
      return;
    }
    onGenerateRoute(duration);
  };

  const handleStartWalk = () => {
    onStartWalk(walkTitle || undefined);
    setShowWalkDialog(false);
    setWalkTitle("");
  };

  const handleAddMoment = () => {
    onAddMoment(momentDescription || undefined);
    setShowMomentDialog(false);
    setMomentDescription("");
    toast({
      title: "Moment Added!",
      description: "Your moment has been pinned to this location.",
    });
  };

  const handleEndWalk = () => {
    onEndWalk();
    toast({
      title: "Walk Completed!",
      description: "Your walk has been saved successfully.",
    });
  };

  // Idle state - route generation
  if (walkState === 'idle') {
    return (
      <div className={`absolute bottom-6 left-6 right-6 ${className}`}>
        <Card className="bg-background/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Generate Walking Route</h3>
              <p className="text-sm text-muted-foreground">
                Choose your desired walk duration to generate a circular route
              </p>
              
              {/* Preset Duration Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Select</Label>
                <div className="flex flex-wrap justify-center gap-2">
                  {durations.map((duration) => (
                    <Badge
                      key={duration}
                      variant={!isCustomDuration && selectedDuration === duration ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handlePresetDuration(duration)}
                    >
                      {duration} min
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Custom Duration Input */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Custom Duration
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="Enter minutes (min: 5)"
                    value={customDuration}
                    onChange={(e) => handleCustomDurationChange(e.target.value)}
                    className={`text-center ${
                      isCustomDuration 
                        ? "border-primary ring-1 ring-primary/20" 
                        : ""
                    }`}
                  />
                  <span className="text-sm text-muted-foreground min-w-fit">minutes</span>
                </div>
                {customDuration && parseInt(customDuration) < 5 && (
                  <p className="text-xs text-destructive">
                    Minimum duration is 5 minutes
                  </p>
                )}
                {isCustomDuration && customDuration && parseInt(customDuration) >= 5 && (
                  <p className="text-xs text-primary">
                    ✓ Custom duration: {customDuration} minutes
                  </p>
                )}
              </div>

              {/* Current Selection Display */}
              <div className="bg-muted/50 rounded-lg p-3 border">
                <p className="text-sm font-medium">
                  Selected Duration: <span className="text-primary">{getEffectiveDuration()} minutes</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Estimated distance: ~{(getEffectiveDuration() * 0.083).toFixed(1)}km
                </p>
              </div>

              <Button 
                onClick={handleGenerateRoute}
                disabled={isLoading || isGenerateDisabled()}
                className="w-full"
                size="lg"
              >
                <MapPin className="w-4 h-4 mr-2" />
                {isLoading ? "Generating..." : `Generate ${getEffectiveDuration()}-min Route`}
              </Button>

              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive mb-3">{error}</p>
                  {(error.includes('network') || error.includes('connection') || error.includes('timeout') || error.includes('fetch')) && (
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Connection Status: {navigator.onLine ? '✅ Online' : '❌ Offline'}</div>
                      <div className="text-left mt-2">
                        <strong>Troubleshooting:</strong>
                        <ul className="list-disc list-inside space-y-1 mt-1">
                          <li>Check your internet connection</li>
                          <li>Try switching between WiFi and mobile data</li>
                          <li>Disable VPN if enabled</li>
                          <li>Try again in a few moments</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Generating state
  if (walkState === 'generating') {
    return (
      <div className={`absolute bottom-6 left-6 right-6 ${className}`}>
        <Card className="bg-background/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="animate-spin mx-auto w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
              <h3 className="text-lg font-semibold">Generating Route...</h3>
              <p className="text-sm text-muted-foreground">
                Creating a {getEffectiveDuration()}-minute circular walking route
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Preview state - route ready to start
  if (walkState === 'preview') {
    return (
      <div className={`absolute bottom-6 left-6 right-6 ${className}`}>
        <Card className="bg-background/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold">Route Ready!</h3>
                {generatedRoute && (
                  <div className="flex justify-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Route className="w-4 h-4" />
                      {formatDistance(generatedRoute.distance)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Timer className="w-4 h-4" />
                      {Math.round(generatedRoute.duration / 60)} min
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={onTryAnotherRoute}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Another
                </Button>

                <Dialog open={showWalkDialog} onOpenChange={setShowWalkDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex-1" size="lg">
                      <Play className="w-4 h-4 mr-2" />
                      Start Walk
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start Your Walk</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="walk-title">Walk Title (Optional)</Label>
                        <Input
                          id="walk-title"
                          placeholder="e.g., Morning Stroll, Park Adventure"
                          value={walkTitle}
                          onChange={(e) => setWalkTitle(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowWalkDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleStartWalk} className="flex-1">
                          <Play className="w-4 h-4 mr-2" />
                          Start Walking
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active/Paused state - live session
  if (walkState === 'active' || walkState === 'paused') {
    return (
      <div className={`absolute bottom-6 left-6 right-6 ${className}`}>
        <Card className="bg-background/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-4">
            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatTime(liveStats.duration)}
                </div>
                <div className="text-xs text-muted-foreground">Time</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatDistance(liveStats.distance)}
                </div>
                <div className="text-xs text-muted-foreground">Distance</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {formatSpeed(liveStats.speed)}
                </div>
                <div className="text-xs text-muted-foreground">Speed</div>
              </div>
            </div>

            {/* Walk Status */}
            {walkState === 'paused' && (
              <div className="text-center mb-4">
                <Badge variant="secondary" className="animate-pulse">
                  <Pause className="w-3 h-3 mr-1" />
                  Paused
                </Badge>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2">
              {walkState === 'active' ? (
                <Button variant="secondary" onClick={onPauseWalk} className="flex-1">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              ) : (
                <Button variant="secondary" onClick={onResumeWalk} className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}

              {walkState === 'active' && (
                <Dialog open={showMomentDialog} onOpenChange={setShowMomentDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Camera className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Moment</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="moment-description">Description (Optional)</Label>
                        <Textarea
                          id="moment-description"
                          placeholder="What's happening here?"
                          value={momentDescription}
                          onChange={(e) => setMomentDescription(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setShowMomentDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddMoment} className="flex-1">
                          <Camera className="w-4 h-4 mr-2" />
                          Add Moment
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}

              <Button variant="destructive" onClick={handleEndWalk}>
                <Square className="w-4 h-4 mr-2" />
                End
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completed state
  if (walkState === 'completed') {
    return (
      <div className={`absolute bottom-6 left-6 right-6 ${className}`}>
        <Card className="bg-background/95 backdrop-blur-sm shadow-lg">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold text-primary">🎉 Walk Complete!</h3>
              
              {currentSession && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{formatTime(currentSession.total_duration)}</div>
                    <div className="text-muted-foreground">Total Time</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{formatDistance(currentSession.total_distance)}</div>
                    <div className="text-muted-foreground">Total Distance</div>
                  </div>
                </div>
              )}

              <Button onClick={() => window.location.reload()} className="w-full">
                <MapPin className="w-4 h-4 mr-2" />
                Start Another Walk
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
} 