"use client";

import { useRouter } from "next/navigation";
import { useLoading } from "@/components/loading-provider";
import { useCallback } from "react";

export function useNavigation() {
  const router = useRouter();
  const { showPageLoader, showPageTransition, hideLoading } = useLoading();

  const navigateWithLoading = useCallback((
    href: string, 
    options?: {
      text?: string;
      description?: string;
      replace?: boolean;
    }
  ) => {
    const { text = "Loading page...", description, replace = false } = options || {};
    
    showPageLoader(text, description);
    
    // Small delay to show the loading state
    setTimeout(() => {
      if (replace) {
        router.replace(href);
      } else {
        router.push(href);
      }
    }, 100);
  }, [router, showPageLoader]);

  const navigateToMap = useCallback(() => {
    navigateWithLoading("/map", {
      text: "Loading Map",
      description: "Initializing GPS and map services..."
    });
  }, [navigateWithLoading]);

  const navigateToHome = useCallback(() => {
    navigateWithLoading("/home", {
      text: "Loading Dashboard",
      description: "Preparing your walking stats..."
    });
  }, [navigateWithLoading]);

  const navigateToProfile = useCallback(() => {
    navigateWithLoading("/profile", {
      text: "Loading Profile",
      description: "Fetching your walking history..."
    });
  }, [navigateWithLoading]);

  const navigateToHistory = useCallback(() => {
    navigateWithLoading("/history", {
      text: "Loading History",
      description: "Retrieving your past walks..."
    });
  }, [navigateWithLoading]);

  const navigateToLogin = useCallback(() => {
    navigateWithLoading("/login", {
      text: "Redirecting to Login",
      description: "Please sign in to continue"
    });
  }, [navigateWithLoading]);

  return {
    navigateWithLoading,
    navigateToMap,
    navigateToHome,
    navigateToProfile,
    navigateToHistory,
    navigateToLogin,
    showPageTransition,
    hideLoading
  };
} 