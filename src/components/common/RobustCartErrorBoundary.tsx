import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface RobustCartErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorState {
  hasError: boolean;
  error?: Error;
}

export class RobustCartErrorBoundary extends React.Component<RobustCartErrorBoundaryProps, ErrorState> {
  constructor(props: RobustCartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorState {
    console.error('🚨 Cart Error Boundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Cart Error Boundary details:', { error, errorInfo });
    
    // Clear potentially corrupted cart data
    try {
      localStorage.removeItem('unified-cart');
      console.log('🧹 Cleared potentially corrupted cart data');
    } catch {
      // Silent fail
    }
  }

  handleReload = () => {
    // Reset error state and reload the component
    this.setState({ hasError: false });
    window.location.reload();
  };

  handleReset = () => {
    // Reset error state without reloading
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-4 bg-destructive/10 rounded-lg border border-destructive/20">
          <AlertTriangle className="w-8 h-8 text-destructive mb-2" />
          <h3 className="text-sm font-medium text-destructive mb-2">Cart Error</h3>
          <p className="text-xs text-muted-foreground text-center mb-3">
            Something went wrong with the cart. Don't worry - your data is safe.
          </p>
          <div className="flex gap-2">
            <Button 
              onClick={this.handleReset}
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              Try Again
            </Button>
            <Button 
              onClick={this.handleReload}
              variant="default" 
              size="sm"
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC to wrap any cart-related component
export const withCartErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  const WrappedComponent: React.ComponentType<P> = (props: P) => (
    <RobustCartErrorBoundary>
      <Component {...props} />
    </RobustCartErrorBoundary>
  );
  
  WrappedComponent.displayName = `withCartErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};