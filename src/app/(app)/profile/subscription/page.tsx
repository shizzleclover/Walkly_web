
"use client";

import * as React from "react";
import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Check, ChevronLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { SubscriptionDialog } from "@/components/subscription-dialog";

const features = [
    "Unlimited AI-Generated Walks",
    "Capture & Save Unlimited Moments",
    "Full, Unrestricted Walk History",
    "Priority Syncing & Support",
    "Unlock All Future Features"
];

export default function SubscriptionPage() {
    const [isDialogOpen, setDialogOpen] = React.useState(false);

    return (
        <AppLayout>
            <SubscriptionDialog open={isDialogOpen} onOpenChange={setDialogOpen} />
            <div className="flex flex-col h-full">
                <header className="p-4 sm:p-6 flex items-center gap-4 sticky top-0 bg-background/80 backdrop-blur-sm z-10 border-b">
                    <Link href="/profile" passHref>
                        <Button variant="ghost" size="icon" className="h-10 w-10">
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-foreground">
                            Go Premium
                        </h1>
                        <p className="text-muted-foreground">Unlock the full Walkly experience.</p>
                    </div>
                </header>

                <div className="p-4 sm:p-6 space-y-8">
                    <Card className="shadow-lg bg-gradient-to-br from-primary/10 to-background">
                        <CardHeader className="items-center text-center">
                            <div className="p-3 bg-primary/20 rounded-full mb-2">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle className="text-2xl">Walkly Premium</CardTitle>
                            <CardDescription className="max-w-md">
                                Get unlimited access to all features and take your walking adventures to the next level.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <ul className="space-y-3">
                                {features.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-3">
                                        <div className="w-5 h-5 bg-green-500 text-white rounded-full flex items-center justify-center">
                                            <Check className="w-3.5 h-3.5" />
                                        </div>
                                        <span className="font-medium">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Choose Your Plan</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Card className="border-primary border-2 shadow-md">
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg">Monthly Plan</h3>
                                        <p className="text-2xl font-bold">$4.99 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                                    </div>
                                    <Button onClick={() => setDialogOpen(true)}>Choose Plan</Button>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardContent className="p-4 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-lg">Annual Plan</h3>
                                        <p className="text-2xl font-bold">$49.99 <span className="text-sm font-normal text-muted-foreground">/ year</span></p>
                                        <p className="text-xs text-green-600 font-semibold">Save 15%</p>
                                    </div>
                                    <Button variant="outline" onClick={() => setDialogOpen(true)}>Choose Plan</Button>
                                </CardContent>
                            </Card>
                        </CardContent>
                        <CardFooter>
                            <p className="text-xs text-muted-foreground">
                                Payments are processed securely. You can cancel anytime.
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
