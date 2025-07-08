"use client";

import { AppLayout } from "@/components/app-layout";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
import { LogOut, Palette, ChevronLeft, CreditCard, User, Crown, Edit3, Save, Upload, Check } from "lucide-react";
import Link from "next/link";
import { useAuthState } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/lib/supabase";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function SettingsPage() {
  const router = useRouter();
  const { user, profile, signOut, isOnTrial, hasPremiumAccess, daysLeftInTrial } = useAuthState();
  const { toast } = useToast();
  
  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    username: profile?.username || '',
    bio: profile?.bio || '',
    avatar_url: profile?.avatar_url || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          username: profileData.username,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error updating profile",
          description: error.message,
        });
      } else {
        toast({
          title: "Profile updated successfully",
          description: "Your profile information has been saved.",
        });
        setIsEditingProfile(false);
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: "An unexpected error occurred.",
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setProfileData({
      username: profile?.username || '',
      bio: profile?.bio || '',
      avatar_url: profile?.avatar_url || ''
    });
    setIsEditingProfile(false);
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
          {/* Profile Editing Card */}
          {user && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Edit3 className="w-5 h-5 text-primary" />
                      <span>Edit Profile</span>
                    </CardTitle>
                    <CardDescription>Update your personal information and preferences.</CardDescription>
                  </div>
                  {!isEditingProfile && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setIsEditingProfile(true)}
                      className="gap-2"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isEditingProfile ? (
                  /* View Mode */
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-20 w-20 ring-4 ring-primary/10 ring-offset-2 ring-offset-background">
                        <AvatarImage src={profile?.avatar_url} alt="User avatar" />
                        <AvatarFallback className="bg-primary/10 text-primary text-xl">
                          {profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold">{profile?.username || 'No username set'}</h3>
                        <p className="text-muted-foreground">{user.email}</p>
                        {profile?.bio && (
                          <p className="text-sm text-muted-foreground mt-1 max-w-md">{profile.bio}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Edit Mode */
                  <div className="space-y-6">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <Avatar className="h-20 w-20 ring-4 ring-primary/10 ring-offset-2 ring-offset-background">
                          <AvatarImage src={profileData.avatar_url} alt="User avatar" />
                          <AvatarFallback className="bg-primary/10 text-primary text-xl">
                            {profileData.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <Button variant="outline" size="sm" className="mt-2 w-full gap-2">
                          <Upload className="w-3 h-3" />
                          Change
                        </Button>
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="username">Username</Label>
                          <Input
                            id="username"
                            value={profileData.username}
                            onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                            placeholder="Enter your username"
                          />
                        </div>
                        
                                                 <div className="space-y-2">
                           <Label htmlFor="bio">Bio</Label>
                           <Textarea
                             id="bio"
                             value={profileData.bio}
                             onChange={(e) => {
                               const value = e.target.value;
                               if (value.length <= 500) {
                                 setProfileData(prev => ({ ...prev, bio: value }));
                               }
                             }}
                             placeholder="Tell us a bit about yourself..."
                             className="min-h-[80px]"
                             maxLength={500}
                           />
                           <p className={`text-xs ${profileData.bio.length > 450 ? 'text-orange-500' : profileData.bio.length > 480 ? 'text-red-500' : 'text-muted-foreground'}`}>
                             {profileData.bio.length}/500 characters
                           </p>
                         </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="avatar_url">Avatar URL</Label>
                          <Input
                            id="avatar_url"
                            value={profileData.avatar_url}
                            onChange={(e) => setProfileData(prev => ({ ...prev, avatar_url: e.target.value }))}
                            placeholder="https://example.com/avatar.jpg"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSavingProfile}
                        className="gap-2"
                      >
                        {isSavingProfile ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSavingProfile}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium text-muted-foreground">Member Since</p>
                  <p className="font-medium">
                    {profile?.created_at 
                      ? new Date(profile.created_at).toLocaleDateString() 
                      : 'Recently joined'
                    }
                  </p>
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
