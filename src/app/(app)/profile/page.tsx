"use client";

import * as React from "react";
import { AppLayout } from "@/components/app-layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart as BarChartIcon, Settings, User, Star } from "lucide-react";
import Link from "next/link";
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Mock user subscription status
type SubscriptionStatus = 'trial' | 'pro' | 'free';

const chartData = [
  { month: "January", walks: 18 },
  { month: "February", walks: 22 },
  { month: "March", walks: 30 },
  { month: "April", walks: 25 },
  { month: "May", walks: 35 },
  { month: "June", walks: 28 },
];

const chartConfig = {
  walks: {
    label: "Walks",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

function WalkChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <YAxis />
          <Tooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Bar dataKey="walks" fill="var(--color-walks)" radius={8} animationDuration={900} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}

export default function ProfilePage() {
  const [subscriptionStatus, setSubscriptionStatus] = React.useState<SubscriptionStatus>('trial');

  return (
    <AppLayout>
      <div className="flex flex-col h-full">
        <header className="p-4 sm:p-6 flex justify-between items-center sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b safe-area-top">
          <div>
            <h1 className="text-3xl font-bold font-headline text-foreground">
              Profile
            </h1>
            <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
          </div>
          <Link href="/profile/settings" passHref>
            <Button variant="ghost" size="icon" className="app-button">
              <Settings className="h-6 w-6" />
            </Button>
          </Link>
        </header>

        <ScrollArea className="flex-1 native-scroll">
          <div className="p-4 sm:p-6 space-y-6">
            {subscriptionStatus === 'trial' && (
              <Card interactive className="bg-gradient-to-br from-primary/5 to-background border-primary/20 shadow-md">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Free Trial</h3>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      7 days left
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                      Enjoying full access during your trial period.
                  </p>
                </CardContent>
              </Card>
            )}
            
            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl">Personal Information</CardTitle>
                <CardDescription>Update your personal details here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-0">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20 ring-4 ring-primary/10 ring-offset-2 ring-offset-background">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="User avatar" data-ai-hint="person portrait"/>
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <User className="w-8 h-8"/>
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline" className="app-button">Change Picture</Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-foreground">Name</Label>
                      <div className="flex items-center gap-2">
                          <Input id="name" defaultValue="Alex Doe" className="app-input" />
                          {subscriptionStatus === 'pro' && <Badge className="bg-primary hover:bg-primary">PRO</Badge>}
                      </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
                    <Input id="email" defaultValue="alex.doe@example.com" disabled className="app-input" />
                  </div>
                </div>
                <Button className="app-button text-base font-semibold">Save Changes</Button>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <BarChartIcon className="w-5 h-5 text-primary" />
                  <span>Activity Stats</span>
                </CardTitle>
                <CardDescription>Your walking trends over the last few months.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <WalkChart />
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </AppLayout>
  );
}
