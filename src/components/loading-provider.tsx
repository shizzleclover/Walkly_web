"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';
import { PageLoader, PageTransitionLoader } from '@/components/ui/loading-spinner';

interface LoadingContextType {
  isLoading: boolean;
  isPageTransition: boolean;
  loadingText: string;
  loadingDescription?: string;
  showPageLoader: (text?: string, description?: string) => void;
  showPageTransition: () => void;
  hideLoading: () => void;
  withLoading: <T>(
    promise: Promise<T>, 
    text?: string, 
    description?: string
  ) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPageTransition, setIsPageTransition] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [loadingDescription, setLoadingDescription] = useState<string | undefined>();

  const showPageLoader = useCallback((text = 'Loading...', description?: string) => {
    setLoadingText(text);
    setLoadingDescription(description);
    setIsPageTransition(false);
    setIsLoading(true);
  }, []);

  const showPageTransition = useCallback(() => {
    setIsPageTransition(true);
    setIsLoading(false);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setIsPageTransition(false);
  }, []);

  const withLoading = useCallback(async <T,>(
    promise: Promise<T>, 
    text = 'Loading...', 
    description?: string
  ): Promise<T> => {
    showPageLoader(text, description);
    try {
      const result = await promise;
      return result;
    } finally {
      hideLoading();
    }
  }, [showPageLoader, hideLoading]);

  return (
    <LoadingContext.Provider value={{
      isLoading,
      isPageTransition,
      loadingText,
      loadingDescription,
      showPageLoader,
      showPageTransition,
      hideLoading,
      withLoading,
    }}>
      {children}
      {isLoading && (
        <PageLoader text={loadingText} description={loadingDescription} />
      )}
      {isPageTransition && <PageTransitionLoader />}
    </LoadingContext.Provider>
  );
} 