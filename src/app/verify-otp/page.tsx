"use client";

import { Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useAuthState } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronLeft, Shield, Mail } from "lucide-react";
import Link from "next/link";

const formSchema = z.object({
  token: z.string().min(6, { message: "Verification code must be at least 6 characters." }),
});

function VerifyOtpContent() {
  const { verifyOtp, signInWithOtp } = useAuthState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60); // 60 second countdown
  
  const email = searchParams.get("email");
  const type = searchParams.get("type") as 'signup' | 'recovery' | 'email' || 'email';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      token: "",
    },
  });

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  // Start countdown on component mount
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  if (!email) {
    return null; // Redirecting...
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!email) return;
    
    setIsLoading(true);
    setError("");

    try {
      console.log('Attempting OTP verification for:', email, 'type:', type);
      const { data, error } = await verifyOtp(email!, values.token, type);
      
      if (error) {
        console.error('OTP verification failed:', error);
        
        // Handle specific error cases
        if (error.message?.includes('expired') || error.message?.includes('invalid')) {
          setError("The verification code has expired or is invalid. Please request a new one.");
          setCanResend(true);
          setCountdown(0);
        } else if (error.message?.includes('Token')) {
          setError("Invalid verification code. Please check your code and try again.");
        } else {
          setError(error.message || "Failed to verify code. Please try again.");
        }
        return;
      }

      if (data?.user) {
        console.log('OTP verification successful');
        // Give a moment for profile to load after verification
        setTimeout(() => {
          // For new signups, always go to onboarding
          if (type === 'signup') {
            console.log('New signup verified, redirecting to onboarding');
            router.push('/onboarding');
          } else {
            // For existing users, check if they completed onboarding
            console.log('Existing user verified, redirecting to home');
            router.push('/home'); // Let the splash screen logic handle proper routing
          }
        }, 1000);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch (error: any) {
      console.error('Unexpected error during OTP verification:', error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    if (!canResend || resendLoading || !email) return;
    
    setResendLoading(true);
    setError("");

    try {
      console.log('Resending OTP to:', email);
      const { data, error } = await signInWithOtp(email!);
      
      if (error) {
        console.error('Failed to resend OTP:', error);
        setError(error.message || "Failed to resend verification code. Please try again.");
      } else {
        console.log('OTP resent successfully');
        // Reset countdown and disable resend button
        setCountdown(60);
        setCanResend(false);
        setError("");
        
        // Show success message briefly
        const successMessage = "A new verification code has been sent to your email.";
        setError(""); // Clear any previous errors
        
        // You might want to show a toast here instead
        console.log(successMessage);
      }
    } catch (error: any) {
      console.error('Unexpected error resending OTP:', error);
      setError("Failed to resend verification code. Please try again.");
    } finally {
      setResendLoading(false);
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'signup':
        return 'Verify Your Email';
      case 'recovery':
        return 'Reset Your Password';
      default:
        return 'Enter Verification Code';
    }
  };

  const getDescription = () => {
    switch (type) {
      case 'signup':
        return `We've sent a verification code to ${email}. Enter the code below to complete your account setup.`;
      case 'recovery':
        return `We've sent a password reset code to ${email}. Enter the code below to reset your password.`;
      default:
        return `We've sent a verification code to ${email}. Enter the code below to continue.`;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 safe-area-top safe-area-bottom">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <Link href="/register" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors app-button">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">{getTitle()}</CardTitle>
              <CardDescription className="mt-2 text-sm">
                {getDescription()}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="token"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter verification code"
                          {...field}
                          className="text-center text-lg tracking-widest font-mono"
                          disabled={isLoading}
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          pattern="[0-9]*"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="bg-destructive/15 border border-destructive/20 text-destructive text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full app-button" 
                  disabled={isLoading}
                >
                  {isLoading ? "Verifying..." : "Verify Code"}
                </Button>

                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?
                  </p>
                  
                  {canResend ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full app-button"
                      onClick={handleResendOtp}
                      disabled={resendLoading}
                    >
                      {resendLoading ? "Sending..." : "Resend Code"}
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Resend available in {countdown} seconds
                    </p>
                  )}
                </div>
              </form>
            </Form>

            <div className="mt-6 pt-6 border-t text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors app-button">
                Return to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center p-4 safe-area-top safe-area-bottom">
        <div className="w-full max-w-md space-y-6">
          <Card className="shadow-lg">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold">Loading...</CardTitle>
                <CardDescription className="mt-2 text-sm">
                  Preparing verification form...
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <LoadingSpinner centered text="Loading verification form..." />
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
} 