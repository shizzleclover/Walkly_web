"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WalkingAnimation } from '@/components/walking-animation';
import { useAuthState } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

export default function SplashScreen() {
  const router = useRouter();
  const { user, profile, loading } = useAuthState();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const handleRedirect = async () => {
      // Wait for authentication state to load
      if (loading) return;

      // Add a minimum splash screen time for better UX
      await new Promise(resolve => setTimeout(resolve, 2000));

      setIsRedirecting(true);

      try {
        if (user && profile) {
          // User is authenticated and profile exists
          if (profile.onboarding_completed) {
            // User has completed onboarding, go to home
            console.log('User authenticated and onboarding completed, redirecting to home');
            router.push('/home');
          } else {
            // User authenticated but needs to complete onboarding
            console.log('User authenticated but onboarding not completed, redirecting to onboarding');
            router.push('/onboarding');
          }
        } else if (user && !profile) {
          // User authenticated but profile not loaded yet (edge case)
          console.log('User authenticated but profile loading, redirecting to onboarding');
          router.push('/onboarding');
        } else {
          // User not authenticated, go to login
          console.log('User not authenticated, redirecting to login');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error during splash screen redirect:', error);
        // Fallback to login on error
        router.push('/login');
      }
    };

    handleRedirect();
  }, [user, profile, loading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary">
      <WalkingAnimation />
      <h1 className="mt-6 text-4xl font-headline font-bold text-foreground">Walkly</h1>
      {(loading || isRedirecting) && (
        <div className="mt-8 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">
            {loading ? 'Checking authentication...' : 'Redirecting...'}
          </span>
        </div>
      )}
    </div>
  );
}
