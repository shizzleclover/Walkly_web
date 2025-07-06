"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WalkingAnimation } from '@/components/walking-animation';

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/onboarding');
    }, 3000); 

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-primary">
      <WalkingAnimation />
      <h1 className="mt-6 text-4xl font-headline font-bold text-foreground">Walkly</h1>
    </div>
  );
}
