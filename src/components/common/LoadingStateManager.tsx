import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LoadingStateManagerProps {
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  children: React.ReactNode;
  onRetry?: () => void;
  emptyMessage?: string;
  errorMessage?: string;
  loadingMessage?: string;
  className?: string;
}

export const LoadingStateManager: React.FC<LoadingStateManagerProps> = ({
  loading,
  error,
  isEmpty,
  children,
  onRetry,
  emptyMessage = "No items found",
  errorMessage = "Something went wrong",
  loadingMessage = "Loading...",
  className = ""
}) => {
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <LoadingSpinner />
        <p className="mt-4 text-sm text-muted-foreground">{loadingMessage}</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={`${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">{errorMessage}</h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            {error}
          </p>
          {onRetry && (
            <Button 
              onClick={onRetry}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (isEmpty) {
    return (
      <Card className={`${className}`}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold mb-2">{emptyMessage}</h3>
          <p className="text-sm text-muted-foreground text-center">
            Try adjusting your search or check back later
          </p>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
};