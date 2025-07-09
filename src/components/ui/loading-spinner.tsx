"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { VariantProps, cva } from "class-variance-authority";

const spinnerVariants = cva(
  "animate-spin rounded-full border-solid border-current",
  {
    variants: {
      size: {
        small: "h-4 w-4 border-2",
        default: "h-8 w-8 border-2",
        large: "h-12 w-12 border-3",
        xl: "h-16 w-16 border-4",
      },
      variant: {
        default: "border-primary border-t-transparent",
        secondary: "border-secondary border-t-transparent", 
        muted: "border-muted-foreground border-t-transparent",
        white: "border-white border-t-transparent",
      }
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  }
);

export interface LoadingSpinnerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spinnerVariants> {
  text?: string;
  centered?: boolean;
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ className, size, variant, text, centered = false, ...props }, ref) => {
    const content = (
      <>
        <div className={cn(spinnerVariants({ size, variant }), className)} {...props} ref={ref} />
        {text && (
          <p className="mt-4 text-sm text-muted-foreground animate-pulse">
            {text}
          </p>
        )}
      </>
    );

    if (centered) {
      return (
        <div className="flex flex-col items-center justify-center h-full w-full">
          {content}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center">
        {content}
      </div>
    );
  }
);

LoadingSpinner.displayName = "LoadingSpinner";

// Page Loading Component for full-screen loading
export function PageLoader({ 
  text = "Loading...", 
  description,
  className 
}: { 
  text?: string; 
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn(
      "fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center",
      className
    )}>
      <div className="flex flex-col items-center space-y-4 text-center max-w-sm mx-auto px-6">
        <LoadingSpinner size="xl" />
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{text}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Page Transition Loading
export function PageTransitionLoader() {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-background">
      <div className="h-full bg-primary animate-pulse" />
    </div>
  );
}

// Inline loading for components
export function InlineLoader({ 
  text, 
  size = "default" 
}: { 
  text?: string; 
  size?: "small" | "default" | "large";
}) {
  return (
    <div className="flex items-center gap-3 py-4">
      <LoadingSpinner size={size} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

export { LoadingSpinner, spinnerVariants }; 