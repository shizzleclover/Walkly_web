"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WalkingAnimation } from "@/components/walking-animation";
import { useAuthState } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Loader2, ArrowLeft, Mail } from "lucide-react";

const formSchema = z.object({
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
});

export default function VerifyOtpPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const { verifyOtp, signInWithOtp, user, loading } = useAuthState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const email = searchParams.get('email') || '';
  const type = (searchParams.get('type') as 'signup' | 'recovery' | 'email') || 'email';

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user && !loading) {
      router.push('/home');
    }
  }, [user, loading, router]);

  // Redirect if no email provided
  React.useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      console.log('Submitting OTP verification for:', email, 'type:', type);
      const { error } = await verifyOtp(email, values.otp, type);
      
      if (error) {
        console.error('OTP verification error:', error);
        toast({
          variant: "destructive",
          title: "Verification failed",
          description: error.message || "Invalid OTP. Please try again.",
        });
      } else {
        console.log('OTP verification successful');
        
        if (type === 'signup') {
          toast({
            title: "Welcome to Walkly! 🎉",
            description: "Your email has been verified. Setting up your account...",
          });
        } else {
          toast({
            title: "Email verified!",
            description: "Your email has been successfully verified.",
          });
        }
        
        // Redirect based on type
        if (type === 'recovery') {
          router.push('/reset-password');
        } else {
          // For signup and regular verification, go to home
          router.push('/home');
        }
      }
    } catch (error: any) {
      console.error('Error in OTP verification:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendOtp() {
    setIsResending(true);
    
    try {
      const { error } = await signInWithOtp(email);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to resend",
          description: error.message || "Failed to resend OTP. Please try again.",
        });
      } else {
        toast({
          title: "OTP Sent",
          description: "A new verification code has been sent to your email.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsResending(false);
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
            Verify Your Email
          </h1>
          <p className="text-muted-foreground">
            Enter the verification code sent to
          </p>
          <p className="text-sm font-medium text-foreground">
            {email}
          </p>
        </div>

        <Card className="shadow-lg border-border/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Enter Verification Code</CardTitle>
            <CardDescription className="text-center">
              We've sent a 6-digit code to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="otp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Verification Code</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 6-digit code"
                          className="app-input text-center text-lg tracking-widest"
                          disabled={isLoading}
                          maxLength={6}
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full app-button text-base font-semibold"
                  disabled={isLoading || !form.watch('otp') || form.watch('otp').length !== 6}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </Button>
              </form>
            </Form>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Didn't receive the code?
                </p>
                <Button
                  variant="outline"
                  className="app-button"
                  onClick={handleResendOtp}
                  disabled={isResending || isLoading}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Resend Code
                    </>
                  )}
                </Button>
              </div>
              
              <div className="text-center">
                <Link 
                  href="/login" 
                  className="inline-flex items-center text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 