import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Clock, Database, Image, Search } from 'lucide-react';

interface PerformanceMetrics {
  collectionsLoaded: number;
  totalCollections: number;
  averageLoadTime: number;
  imagesPreloaded: number;
  searchCacheWarmed: boolean;
  targetAchieved: boolean;
  isOptimized: boolean;
}

interface UltraAggressivePerformanceMonitorProps {
  metrics?: PerformanceMetrics;
  className?: string;
}

/**
 * Performance Monitor - Shows ultra-aggressive optimization status
 * For admin/debugging - ensures sub-0.2s loading is achieved
 */
export const UltraAggressivePerformanceMonitor: React.FC<UltraAggressivePerformanceMonitorProps> = ({
  metrics,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [performanceLog, setPerformanceLog] = useState<string[]>([]);

  // Show monitor only in development or when explicitly enabled
  useEffect(() => {
    const shouldShow = localStorage.getItem('show-performance-monitor') === 'true' || 
                     window.location.hostname === 'localhost';
    setIsVisible(shouldShow);
  }, []);

  // Listen to performance logs
  useEffect(() => {
    const handleLog = (event: CustomEvent) => {
      const newLog = `${new Date().toLocaleTimeString()}: ${event.detail}`;
      setPerformanceLog(prev => [newLog, ...prev].slice(0, 10)); // Keep last 10 logs
    };

    window.addEventListener('ultra-performance-log' as any, handleLog);
    return () => window.removeEventListener('ultra-performance-log' as any, handleLog);
  }, []);

  if (!isVisible) return null;

  const defaultMetrics: PerformanceMetrics = {
    collectionsLoaded: 0,
    totalCollections: 0,
    averageLoadTime: 0,
    imagesPreloaded: 0,
    searchCacheWarmed: false,
    targetAchieved: false,
    isOptimized: false
  };

  const currentMetrics = metrics || defaultMetrics;

  const getStatusColor = (achieved: boolean) => 
    achieved ? 'text-green-600' : 'text-yellow-600';

  const getStatusBadge = (achieved: boolean, text: string) => (
    <Badge variant={achieved ? 'default' : 'secondary'} className={getStatusColor(achieved)}>
      {achieved ? '✅' : '⏳'} {text}
    </Badge>
  );

  return (
    <div className={`fixed bottom-4 right-4 z-[9999] max-w-sm ${className}`}>
      <Card className="shadow-xl border-2 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-primary" />
            Ultra-Aggressive Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Main Target */}
          <div className="text-center p-2 bg-muted rounded-lg">
            <div className="text-lg font-bold">
              {currentMetrics.averageLoadTime > 0 ? `${currentMetrics.averageLoadTime.toFixed(2)}ms` : 'Measuring...'}
            </div>
            <div className="text-xs text-muted-foreground">
              Target: &lt;200ms
            </div>
            {getStatusBadge(currentMetrics.targetAchieved, 'SUB-0.2s ACHIEVED')}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              <span>{currentMetrics.collectionsLoaded}/{currentMetrics.totalCollections}</span>
            </div>
            <div className="flex items-center gap-1">
              <Image className="w-3 h-3" />
              <span>{currentMetrics.imagesPreloaded} imgs</span>
            </div>
            <div className="flex items-center gap-1">
              <Search className="w-3 h-3" />
              <span className={getStatusColor(currentMetrics.searchCacheWarmed)}>
                {currentMetrics.searchCacheWarmed ? 'Ready' : 'Warming'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className={getStatusColor(currentMetrics.isOptimized)}>
                {currentMetrics.isOptimized ? 'Optimized' : 'Loading'}
              </span>
            </div>
          </div>

          {/* Performance Log */}
          {performanceLog.length > 0 && (
            <div className="max-h-20 overflow-y-auto bg-black/5 rounded p-2">
              <div className="text-xs font-medium mb-1">Recent Activity:</div>
              {performanceLog.slice(0, 3).map((log, index) => (
                <div key={index} className="text-xs text-muted-foreground truncate">
                  {log}
                </div>
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-6"
              onClick={() => setIsVisible(false)}
            >
              Hide
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-6"
              onClick={() => setPerformanceLog([])}
            >
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Utility function to log performance events
export const logPerformance = (message: string) => {
  console.log(`🚀 ULTRA-PERFORMANCE: ${message}`);
  
  // Dispatch custom event for monitor
  window.dispatchEvent(new CustomEvent('ultra-performance-log', {
    detail: message
  }));
};