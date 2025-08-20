import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Clock, 
  Database, 
  TrendingUp, 
  TrendingDown,
  Zap,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  componentCount: number;
  reRenderCount: number;
  loadTime: number;
  cacheHitRate: number;
  bundleSize: number;
  apiResponseTime: number;
}

interface PerformanceIssue {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  suggestion: string;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
}

// Performance monitoring hook
const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    componentCount: 0,
    reRenderCount: 0,
    loadTime: 0,
    cacheHitRate: 0,
    bundleSize: 0,
    apiResponseTime: 0
  });
  
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const measurePerformance = useCallback(() => {
    // Measure render time
    const renderStart = performance.now();
    
    // Simulate render measurement
    setTimeout(() => {
      const renderEnd = performance.now();
      const renderTime = renderEnd - renderStart;
      
      // Get memory usage if available
      const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Count DOM elements as proxy for component count
      const componentCount = document.querySelectorAll('[data-component]').length;
      
      // Get performance entries
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      const loadTime = navigationEntries[0]?.loadEventEnd - navigationEntries[0]?.loadEventStart || 0;
      
      setMetrics(prev => ({
        ...prev,
        renderTime,
        memoryUsage: Math.round(memoryUsage / 1024 / 1024), // Convert to MB
        componentCount,
        loadTime,
        reRenderCount: prev.reRenderCount + 1
      }));
      
      // Analyze for issues
      analyzePerformance({
        renderTime,
        memoryUsage: Math.round(memoryUsage / 1024 / 1024),
        componentCount,
        loadTime
      });
    }, 0);
  }, []);

  const analyzePerformance = useCallback((currentMetrics: Partial<PerformanceMetrics>) => {
    const newIssues: PerformanceIssue[] = [];
    
    // Check render time
    if (currentMetrics.renderTime && currentMetrics.renderTime > 100) {
      newIssues.push({
        id: `render-${Date.now()}`,
        type: currentMetrics.renderTime > 300 ? 'error' : 'warning',
        title: 'Slow Render Performance',
        description: `Render time: ${currentMetrics.renderTime.toFixed(2)}ms`,
        suggestion: 'Consider memoizing components or reducing component complexity',
        priority: currentMetrics.renderTime > 300 ? 'high' : 'medium',
        timestamp: new Date()
      });
    }
    
    // Check memory usage
    if (currentMetrics.memoryUsage && currentMetrics.memoryUsage > 50) {
      newIssues.push({
        id: `memory-${Date.now()}`,
        type: 'warning',
        title: 'High Memory Usage',
        description: `Memory usage: ${currentMetrics.memoryUsage}MB`,
        suggestion: 'Check for memory leaks or optimize data structures',
        priority: 'medium',
        timestamp: new Date()
      });
    }
    
    // Check component count
    if (currentMetrics.componentCount && currentMetrics.componentCount > 100) {
      newIssues.push({
        id: `components-${Date.now()}`,
        type: 'info',
        title: 'High Component Count',
        description: `${currentMetrics.componentCount} components detected`,
        suggestion: 'Consider component virtualization for large lists',
        priority: 'low',
        timestamp: new Date()
      });
    }
    
    setIssues(prev => [...newIssues, ...prev.slice(0, 10)]); // Keep last 10 issues
  }, []);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    const interval = setInterval(measurePerformance, 2000);
    
    return () => {
      clearInterval(interval);
      setIsMonitoring(false);
    };
  }, [measurePerformance]);

  const clearIssues = useCallback(() => {
    setIssues([]);
    toast.success('Performance issues cleared');
  }, []);

  return {
    metrics,
    issues,
    isMonitoring,
    startMonitoring,
    measurePerformance,
    clearIssues
  };
};

// Performance score calculator
const calculatePerformanceScore = (metrics: PerformanceMetrics): number => {
  let score = 100;
  
  // Render time impact (0-30 points)
  if (metrics.renderTime > 100) score -= Math.min(30, (metrics.renderTime - 100) / 10);
  
  // Memory usage impact (0-25 points)
  if (metrics.memoryUsage > 25) score -= Math.min(25, (metrics.memoryUsage - 25) / 2);
  
  // Load time impact (0-25 points)
  if (metrics.loadTime > 1000) score -= Math.min(25, (metrics.loadTime - 1000) / 100);
  
  // Re-render impact (0-20 points)
  if (metrics.reRenderCount > 5) score -= Math.min(20, (metrics.reRenderCount - 5) * 2);
  
  return Math.max(0, Math.round(score));
};

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
};

const getScoreBadge = (score: number): { variant: 'default' | 'secondary' | 'destructive' | 'outline', text: string } => {
  if (score >= 80) return { variant: 'default', text: 'Excellent' };
  if (score >= 60) return { variant: 'secondary', text: 'Good' };
  return { variant: 'destructive', text: 'Needs Improvement' };
};

// Optimization suggestions
const OPTIMIZATION_SUGGESTIONS = [
  {
    title: 'Use React.memo',
    description: 'Prevent unnecessary re-renders of components',
    code: 'export const MyComponent = React.memo(({ props }) => { ... });'
  },
  {
    title: 'Implement useMemo',
    description: 'Cache expensive calculations',
    code: 'const expensiveValue = useMemo(() => heavyCalculation(data), [data]);'
  },
  {
    title: 'Use useCallback',
    description: 'Memoize event handlers',
    code: 'const handleClick = useCallback(() => { ... }, [dependencies]);'
  },
  {
    title: 'Code Splitting',
    description: 'Load components lazily',
    code: 'const LazyComponent = lazy(() => import("./Component"));'
  },
  {
    title: 'Virtual Scrolling',
    description: 'Handle large lists efficiently',
    code: 'Use react-window or react-virtualized for large datasets'
  }
];

export const CoverPagePerformanceMonitor: React.FC = () => {
  const { 
    metrics, 
    issues, 
    isMonitoring, 
    startMonitoring, 
    measurePerformance, 
    clearIssues 
  } = usePerformanceMonitor();
  
  const performanceScore = calculatePerformanceScore(metrics);
  const scoreBadge = getScoreBadge(performanceScore);
  
  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, [startMonitoring]);

  return (
    <div className="space-y-6">
      {/* Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Performance Score
            </span>
            <Badge variant={scoreBadge.variant}>{scoreBadge.text}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-4xl font-bold">
              <span className={getScoreColor(performanceScore)}>
                {performanceScore}
              </span>
              <span className="text-muted-foreground text-xl">/100</span>
            </div>
            <div className="flex-1">
              <Progress value={performanceScore} className="h-3" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="issues">Issues ({issues.length})</TabsTrigger>
          <TabsTrigger value="optimize">Optimize</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Render Time */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Render Time</p>
                    <p className="text-2xl font-bold">
                      {metrics.renderTime.toFixed(1)}
                      <span className="text-sm text-muted-foreground ml-1">ms</span>
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Memory Usage</p>
                    <p className="text-2xl font-bold">
                      {metrics.memoryUsage}
                      <span className="text-sm text-muted-foreground ml-1">MB</span>
                    </p>
                  </div>
                  <Database className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            {/* Component Count */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Components</p>
                    <p className="text-2xl font-bold">{metrics.componentCount}</p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            {/* Re-renders */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Re-renders</p>
                    <p className="text-2xl font-bold">{metrics.reRenderCount}</p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={measurePerformance} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Measure Now
            </Button>
            <Badge variant={isMonitoring ? 'default' : 'secondary'}>
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Inactive'}
            </Badge>
          </div>
        </TabsContent>

        <TabsContent value="issues">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Performance Issues</h3>
              <Button onClick={clearIssues} variant="outline" size="sm">
                Clear All
              </Button>
            </div>

            {issues.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Issues Detected</h3>
                  <p className="text-muted-foreground">
                    Your cover page editor is performing well!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {issues.map((issue) => (
                  <Card key={issue.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {issue.type === 'error' ? (
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                          ) : issue.type === 'warning' ? (
                            <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          ) : (
                            <TrendingUp className="w-5 h-5 text-blue-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{issue.title}</h4>
                            <Badge 
                              variant={issue.priority === 'high' ? 'destructive' : 
                                      issue.priority === 'medium' ? 'secondary' : 'outline'}
                            >
                              {issue.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {issue.description}
                          </p>
                          <p className="text-sm font-medium text-blue-600">
                            💡 {issue.suggestion}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {issue.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="optimize">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Optimization Suggestions</h3>
            
            <div className="grid gap-4">
              {OPTIMIZATION_SUGGESTIONS.map((suggestion, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">{suggestion.title}</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      {suggestion.description}
                    </p>
                    <div className="bg-muted p-3 rounded-md">
                      <code className="text-sm">{suggestion.code}</code>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};