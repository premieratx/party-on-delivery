import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle } from 'lucide-react';

interface ProductLoadErrorProps {
  onRetry?: () => void;
  message?: string;
  className?: string;
}

export const ProductLoadError: React.FC<ProductLoadErrorProps> = ({
  onRetry,
  message = "Failed to load",
  className = ""
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-6 text-center ${className}`}>
      <AlertCircle className="w-8 h-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-3">{message}</p>
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline" 
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      )}
    </div>
  );
};