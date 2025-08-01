import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface FastLoaderProps {
  children: React.ReactNode;
  isLoading: boolean;
  loadingText?: string;
  delay?: number;
}

export const FastLoader: React.FC<FastLoaderProps> = ({
  children,
  isLoading,
  loadingText = "Loading...",
  delay = 100
}) => {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Small delay to prevent flash for very fast loading
      const timer = setTimeout(() => setShowLoading(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
    }
  }, [isLoading, delay]);

  if (isLoading && showLoading) {
    return <LoadingSpinner text={loadingText} />;
  }

  return <>{children}</>;
};