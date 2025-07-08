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
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
});

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { resetPassword, user, profile, loading } = useAuthState();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user && !loading) {
      // Check if user completed onboarding, if not redirect to onboarding
      if (user && profile?.onboarding_completed) {
        router.push('/home');
      } else if (user && profile && !profile.onboarding_completed) {
        router.push('/onboarding');
      }
    }
  }, [user, profile, loading, router]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const { error } = await resetPassword(values.email);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Failed to send OTP",
          description: error.message || "Please check your email address and try again.",
        });
      } else {
        toast({
          title: "OTP sent!",
          description: "Please check your email for the verification code.",
        });
        router.push(`/verify-otp?email=${encodeURIComponent(values.email)}&type=recovery`);
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
            Reset Password
          </h1>
          <p className="text-muted-foreground">
            Enter your email to receive a verification code for password reset
          </p>
        </div>

        <Card className="shadow-lg border-border/50">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Forgot Password</CardTitle>
                <CardDescription className="text-center">
                  Enter your email address and we'll send you a verification code
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
                              placeholder="Enter your email address"
                              className="app-input"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full app-button text-base font-semibold"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending OTP Code...
                        </>
                      ) : (
                        'Send OTP Code'
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="text-center">
                  <Link 
                    href="/login" 
                    className="inline-flex items-center text-sm text-primary hover:underline"
                  >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Sign In
                  </Link>
                </div>
              </CardContent>
        </Card>
      </div>
    </div>
  );
} 