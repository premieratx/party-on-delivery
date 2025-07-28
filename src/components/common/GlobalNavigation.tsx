import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationState {
  path: string;
  timestamp: number;
}

export const GlobalNavigation = ({ className }: { className?: string }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get navigation history from sessionStorage
  const getNavigationHistory = (): NavigationState[] => {
    try {
      const history = sessionStorage.getItem('navigation-history');
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  };

  // Update navigation history
  const updateNavigationHistory = (path: string) => {
    const history = getNavigationHistory();
    const newEntry: NavigationState = {
      path,
      timestamp: Date.now()
    };
    
    // Remove duplicate paths and add new entry
    const filteredHistory = history.filter(entry => entry.path !== path);
    const updatedHistory = [...filteredHistory, newEntry];
    
    // Keep only last 10 entries
    const trimmedHistory = updatedHistory.slice(-10);
    
    sessionStorage.setItem('navigation-history', JSON.stringify(trimmedHistory));
  };

  // Update history when location changes
  React.useEffect(() => {
    updateNavigationHistory(location.pathname);
  }, [location.pathname]);

  const history = getNavigationHistory();
  const currentIndex = history.findIndex(entry => entry.path === location.pathname);
  
  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1 && currentIndex !== -1;

  const handleBack = () => {
    if (canGoBack) {
      const previousPath = history[currentIndex - 1].path;
      navigate(previousPath);
    }
  };

  const handleForward = () => {
    if (canGoForward) {
      const nextPath = history[currentIndex + 1].path;
      navigate(nextPath);
    }
  };

  return (
    <div className={cn(
      "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50",
      "flex items-center gap-2 bg-background/95 backdrop-blur border rounded-lg px-3 py-2 shadow-lg",
      className
    )}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        disabled={!canGoBack}
        className="h-8 w-8 p-0"
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      
      <div className="text-xs text-muted-foreground px-2">
        {currentIndex + 1} / {history.length}
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleForward}
        disabled={!canGoForward}
        className="h-8 w-8 p-0"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
