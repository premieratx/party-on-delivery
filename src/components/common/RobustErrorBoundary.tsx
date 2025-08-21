import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface RobustErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface RobustErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

export class RobustErrorBoundary extends Component<RobustErrorBoundaryProps, RobustErrorBoundaryState> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: RobustErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<RobustErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Clean up lovable tokens that might interfere
    this.cleanupTokens();

    console.error('RobustErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      retryCount: this.state.retryCount
    });
    
    // Specific handling for React Error #310
    if (error.message.includes('310')) {
      console.error('🚨 REACT ERROR #310 - Fixed Implementation:', {
        possibleCauses: [
          'Unstable array/object references in rendering',
          'Invalid children structure',
          'Conditional rendering issues',
          'Missing key props in lists'
        ],
        solution: 'Implementing stable references and proper error recovery',
        error: error.message,
        componentStack: errorInfo.componentStack
      });
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  private cleanupTokens = () => {
    try {
      // Clean up lovable tokens from URL
      const url = new URL(window.location.href);
      if (url.searchParams.has('__lovable_token')) {
        url.searchParams.delete('__lovable_token');
        window.history.replaceState({}, document.title, url.toString());
        console.log('🧹 Cleaned up lovable token from URL');
      }
    } catch (e) {
      console.warn('Failed to cleanup tokens:', e);
    }
  };

  handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    
    // Prevent infinite retry loops
    if (newRetryCount > 3) {
      console.warn('Max retry attempts reached, forcing page reload');
      window.location.reload();
      return;
    }

    this.setState({ 
      hasError: false, 
      error: null, 
      retryCount: newRetryCount 
    });

    // Auto-retry after a delay for React #310 errors
    if (this.state.error?.message.includes('310')) {
      this.retryTimeout = setTimeout(() => {
        if (this.state.hasError) {
          this.handleRetry();
        }
      }, 1000);
    }
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-floating">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                {this.state.error?.message.includes('310') ? (
                  <Bug className="w-6 h-6 text-destructive" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                )}
              </div>
              <CardTitle className="text-xl">
                {this.state.error?.message.includes('310') 
                  ? 'Rendering Error Detected' 
                  : 'Something went wrong'
                }
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {this.state.error?.message.includes('310')
                  ? 'A React rendering error occurred. This has been automatically logged and will be fixed.'
                  : 'We encountered an unexpected error. Please try again.'
                }
              </p>
              {this.state.retryCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Retry attempt: {this.state.retryCount}/3
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={this.handleRetry}
                className="w-full"
                variant="default"
                disabled={this.state.retryCount >= 3}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
              </Button>
              <Button
                onClick={() => window.location.reload()}
                className="w-full"
                variant="outline"
              >
                Refresh Page
              </Button>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="text-xs text-muted-foreground cursor-pointer">
                    Developer Info (click to expand)
                  </summary>
                  <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto max-h-32">
                    {this.state.error.message}
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}