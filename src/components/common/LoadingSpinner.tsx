import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className,
  text 
}) => {
  // Show actual loading indicator instead of disabled one
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <div className="text-sm text-muted-foreground">
        {text || 'Loading...'}
      </div>
    </div>
  );
};