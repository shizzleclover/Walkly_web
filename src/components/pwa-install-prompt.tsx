"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  X, 
  Smartphone, 
  Monitor, 
  Share, 
  Plus, 
  MoreVertical,
  Chrome,
  Download,
  Home,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PWAInstallPromptProps {
  className?: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

type DeviceType = 'ios-safari' | 'android-chrome' | 'desktop-chrome' | 'other';
type InstallStatus = 'prompt' | 'installed' | 'dismissed' | 'hidden';

export function PWAInstallPrompt({ className }: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [deviceType, setDeviceType] = React.useState<DeviceType>('other');
  const [installStatus, setInstallStatus] = React.useState<InstallStatus>('hidden');
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setInstallStatus('dismissed');
      return;
    }

    // Detect device and browser
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChrome = /chrome/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    const isDesktop = !(/mobi|android/i.test(userAgent));

    let detectedDevice: DeviceType = 'other';
    if (isIOS && isSafari) {
      detectedDevice = 'ios-safari';
    } else if (isAndroid && isChrome) {
      detectedDevice = 'android-chrome';
    } else if (isDesktop && isChrome) {
      detectedDevice = 'desktop-chrome';
    }

    setDeviceType(detectedDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstallStatus('installed');
      return;
    }

    // Listen for beforeinstallprompt (Chrome/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setInstallStatus('prompt');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show prompt after a delay if conditions are met
    const timer = setTimeout(() => {
      if (detectedDevice !== 'other') {
        setInstallStatus('prompt');
        setIsVisible(true);
      }
    }, 5000); // Show after 5 seconds

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Use native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setInstallStatus('installed');
      }
      
      setDeferredPrompt(null);
      setIsVisible(false);
    } else {
      // Keep the prompt open for manual instructions
      // User will need to follow the manual steps
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setInstallStatus('dismissed');
    setIsVisible(false);
  };

  const getInstallInstructions = () => {
    switch (deviceType) {
      case 'ios-safari':
        return {
          title: "Add Walkly to Your Home Screen",
          steps: [
            { icon: Share, text: "Tap the Share button at the bottom" },
            { icon: Plus, text: "Select 'Add to Home Screen'" },
            { icon: Home, text: "Tap 'Add' to confirm" }
          ],
          note: "Access Walkly like a native app with full-screen experience"
        };
      
      case 'android-chrome':
        return {
          title: "Install Walkly App",
          steps: [
            { icon: MoreVertical, text: "Tap the menu (⋮) in the top right" },
            { icon: Plus, text: "Select 'Add to Home screen'" },
            { icon: Download, text: "Tap 'Install' to confirm" }
          ],
          note: "Get the full app experience with offline support"
        };
      
      case 'desktop-chrome':
        return {
          title: "Install Walkly on Your Computer",
          steps: [
            { icon: MoreVertical, text: "Click the menu (⋮) in the top right" },
            { icon: Download, text: "Select 'Install Walkly...'" },
            { icon: Monitor, text: "Click 'Install' in the popup" }
          ],
          note: "Access Walkly from your taskbar and desktop"
        };
      
      default:
        return null;
    }
  };

  if (installStatus !== 'prompt' || !isVisible) {
    return null;
  }

  const instructions = getInstallInstructions();
  if (!instructions) return null;

  return (
    <div className={cn(
      "fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500",
      "sm:left-auto sm:right-4 sm:max-w-sm",
      className
    )}>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background shadow-xl">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-primary/10 rounded-lg">
                <Smartphone className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{instructions.title}</h3>
                <Badge variant="secondary" className="text-xs mt-1">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Better Experience
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-2 mb-4">
            {instructions.steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="flex-shrink-0 w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-primary text-xs font-semibold">{index + 1}</span>
                </div>
                <div className="flex items-center gap-2 flex-1">
                  <step.icon className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{step.text}</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground mb-4">
            {instructions.note}
          </p>

          <div className="flex gap-2">
            {deferredPrompt ? (
              <Button onClick={handleInstall} className="flex-1 gap-2" size="sm">
                <Download className="w-3 h-3" />
                Install Now
              </Button>
            ) : (
              <Button variant="outline" onClick={handleDismiss} className="flex-1" size="sm">
                Got it!
              </Button>
            )}
            <Button variant="ghost" onClick={handleDismiss} size="sm">
              Maybe Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to check if app is already installed
export function useIsPWAInstalled() {
  const [isInstalled, setIsInstalled] = React.useState(false);

  React.useEffect(() => {
    // Check if running in standalone mode
    const checkInstalled = () => {
      setIsInstalled(
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any)?.standalone === true
      );
    };

    checkInstalled();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstalled);

    return () => mediaQuery.removeEventListener('change', checkInstalled);
  }, []);

  return isInstalled;
}

// Component for showing install status in settings
export function PWAInstallStatus() {
  const isInstalled = useIsPWAInstalled();

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "w-2 h-2 rounded-full",
        isInstalled ? "bg-green-500" : "bg-muted-foreground"
      )} />
      <span className="text-sm text-muted-foreground">
        {isInstalled ? "Installed as app" : "Web version"}
      </span>
    </div>
  );
} 