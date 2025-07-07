"use client";

import { AppLayout } from "@/components/app-layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { LogOut, Palette, ChevronLeft, CreditCard, User, Crown } from "lucide-react";
import Link from "next/link";
import { useAuthState } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, signOut, isOnTrial, hasPremiumAccess, daysLeftInTrial } = useAuthState();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        toast({
          variant: "destructive",
          title: "Error signing out",
          description: error.message,
        });
      } else {
        toast({
          title: "Signed out successfully",
          description: "You have been signed out of your account.",
        });
        router.push("/login");
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error signing out",
        description: "An unexpected error occurred.",
      });
    }
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
          {/* Account Info Card */}
          {user ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <span>Account Information</span>
                </CardTitle>
                <CardDescription>Your account details and current plan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Username</p>
                  <p className="font-medium">{profile?.username || 'Not set'}</p>
                </div>
                
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email || profile?.email || 'Loading...'}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Plan Status</p>
                  <div className="flex items-center gap-2">
                    {profile ? (
                      <>
                        {hasPremiumAccess ? (
                          <>
                            {isOnTrial ? (
                              <Badge className="bg-primary/10 text-primary border-primary/20">
                                Free Trial - {daysLeftInTrial} days left
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                <Crown className="w-3 h-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </>
                        ) : (
                          <Badge variant="secondary">Free</Badge>
                        )}
                      </>
                    ) : (
                      <Badge variant="outline" className="animate-pulse">
                        Setting up account...
                      </Badge>
                    )}
                  </div>
                </div>
                {!profile && (
                  <div className="mt-4 p-3 bg-muted/50 rounded-md">
                    <p className="text-sm text-muted-foreground">
                      🎉 Welcome! Your account is being set up. You'll have access to all features in just a moment.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <p className="text-muted-foreground">Loading account information...</p>
                </div>
              </CardContent>
            </Card>
          )}

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
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span>Subscription</span>
              </CardTitle>
              <CardDescription>
                Manage your subscription plan and billing details.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/profile/subscription" passHref>
                <Button className="w-full sm:w-auto">
                  Manage Subscription
                </Button>
              </Link>
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
               <CardTitle>Account Actions</CardTitle>
              <CardDescription>Manage your account session and data.</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full sm:w-auto">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to log out?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You will be signed out of your account and redirected to the login page.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLogout}>
                      Log Out
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
