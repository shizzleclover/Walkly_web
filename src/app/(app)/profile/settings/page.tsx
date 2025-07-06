
"use client";

import { AppLayout } from "@/components/app-layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { LogOut, Palette, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const router = useRouter();

  const handleLogout = () => {
    // In a real app, you'd clear the user session here.
    router.push("/login");
  };

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="p-4 sm:p-6 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
          <Link href="/profile" passHref>
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ChevronLeft className="h-6 w-6" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">
              Settings
            </h1>
            <p className="text-muted-foreground">Adjust app settings and manage your account.</p>
          </div>
        </header>

        <div className="p-4 sm:p-6 space-y-8">
          <Card>
            <CardHeader>
               <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                <span>Appearance</span>
              </CardTitle>
              <CardDescription>Customize the look and feel of the app.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="font-medium">Theme</p>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
               <CardTitle>Account</CardTitle>
              <CardDescription>Manage your account session.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={handleLogout} className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
