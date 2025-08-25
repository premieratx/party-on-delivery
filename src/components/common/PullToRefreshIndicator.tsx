import React from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  threshold: number;
  isRefreshing: boolean;
  shouldTrigger: boolean;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  threshold,
  isRefreshing,
  shouldTrigger
}) => {
  const progress = Math.min(pullDistance / threshold, 1);
  const opacity = Math.min(pullDistance / 40, 1);

  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex justify-center"
      style={{ 
        transform: `translateY(${Math.min(pullDistance - 40, 40)}px)`,
        opacity
      }}
    >
      <div className="bg-background/90 backdrop-blur-sm border border-border rounded-full p-3 shadow-lg">
        {isRefreshing ? (
          <RefreshCw className="w-6 h-6 text-primary animate-spin" />
        ) : shouldTrigger ? (
          <div className="relative">
            <RefreshCw className="w-6 h-6 text-primary" />
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
          </div>
        ) : (
          <div className="relative">
            <ArrowDown 
              className="w-6 h-6 text-muted-foreground transition-transform duration-200"
              style={{ transform: `rotate(${progress * 180}deg)` }}
            />
            <div 
              className="absolute inset-0 border-2 border-primary/30 rounded-full"
              style={{
                clipPath: `conic-gradient(from 0deg, transparent ${(1-progress) * 360}deg, black 0deg)`
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};