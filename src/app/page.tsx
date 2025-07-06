"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Footprints } from 'lucide-react';

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
      <div className="animate-pulse">
        <Footprints className="w-24 h-24 text-primary" />
      </div>
      <h1 className="mt-6 text-4xl font-headline font-bold text-foreground">Walkly</h1>
    </div>
  );
}
