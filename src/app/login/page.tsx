"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { WalkingAnimation } from "@/components/walking-animation";
import { useAuthState } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isOtpMode, setIsOtpMode] = React.useState(false);
  const { signIn, signInWithOtp, user, loading } = useAuthState();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user && !loading) {
      router.push('/home');
    }
  }, [user, loading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      if (isOtpMode) {
        const { error } = await signInWithOtp(values.email);
        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to send OTP. Please try again.",
          });
        } else {
          toast({
            title: "OTP Sent",
            description: "Please check your email for the verification code.",
          });
          router.push(`/verify-otp?email=${encodeURIComponent(values.email)}&type=email`);
        }
      } else {
        const { error } = await signIn(values.email, values.password);
        if (error) {
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: error.message || "Please check your credentials and try again.",
          });
        } else {
          toast({
            title: "Welcome back!",
            description: "You have been successfully signed in.",
          });
          router.push('/home');
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <WalkingAnimation className="mx-auto h-16 w-16 text-primary" />
          <h1 className="text-3xl font-bold font-headline text-foreground">
            Welcome to Walkly
          </h1>
          <p className="text-muted-foreground">
            Sign in to continue your walking journey
          </p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">
              {isOtpMode ? 'Sign in with Email' : 'Sign In'}
            </CardTitle>
            <CardDescription className="text-center">
              {isOtpMode 
                ? 'Enter your email to receive a verification code'
                : 'Enter your email and password below'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          className="app-input"
                          disabled={isLoading}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {!isOtpMode && (
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="app-input"
                            disabled={isLoading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <Button 
                  type="submit" 
                  className="w-full app-button text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isOtpMode ? 'Sending...' : 'Signing in...'}
                    </>
                  ) : (
                    <>
                      {isOtpMode ? (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send OTP Code
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </>
                  )}
                </Button>
              </form>
            </Form>

            <div className="space-y-4">
              <Separator />
              
              <Button
                variant="outline"
                className="w-full app-button"
                onClick={() => setIsOtpMode(!isOtpMode)}
                disabled={isLoading}
              >
                {isOtpMode ? 'Use Password Instead' : 'Use OTP Code Instead'}
              </Button>
              
              {!isOtpMode && (
                <div className="text-center">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </div>
              )}
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?
                </p>
                <Link href="/register">
                  <Button variant="ghost" className="app-button text-primary">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
