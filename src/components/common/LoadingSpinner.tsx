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
  // NO SPINNING ANIMATION - DISABLED
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <div className="text-sm text-muted-foreground">
        {text || 'Loading...'}
      </div>
    </div>
  );
};