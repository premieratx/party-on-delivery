import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Zap, 
  Smartphone, 
  Package, 
  Monitor,
  Clock,
  Gauge,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Database,
  Image as ImageIcon,
  Code,
  Wifi
} from 'lucide-react';

interface PerformanceMetric {
  name: string;
  current: number;
  target: number;
  unit: string;
  status: 'good' | 'warning' | 'poor';
}

interface OptimizationTask {
  id: string;
  title: string;
  description: string;
  category: 'bundle' | 'images' | 'components' | 'mobile' | 'caching' | 'database';
  status: 'pending' | 'in-progress' | 'completed';
  impact: 'high' | 'medium' | 'low';
  estimatedTime: string;
}

const PerformanceOptimization = () => {
  const navigate = useNavigate();
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([
    { name: 'First Contentful Paint', current: 2.1, target: 1.5, unit: 's', status: 'warning' },
    { name: 'Largest Contentful Paint', current: 3.2, target: 2.5, unit: 's', status: 'warning' },
    { name: 'Time to Interactive', current: 4.1, target: 3.0, unit: 's', status: 'poor' },
    { name: 'Bundle Size', current: 1.2, target: 0.8, unit: 'MB', status: 'warning' },
    { name: 'Mobile Performance Score', current: 78, target: 90, unit: '/100', status: 'warning' },
    { name: 'Desktop Performance Score', current: 85, target: 95, unit: '/100', status: 'warning' }
  ]);

  const [optimizationTasks, setOptimizationTasks] = useState<OptimizationTask[]>([
    {
      id: '1',
      title: 'Implement Code Splitting',
      description: 'Split routes and components to reduce initial bundle size',
      category: 'bundle',
      status: 'pending',
      impact: 'high',
      estimatedTime: '2-3 hours'
    },
    {
      id: '2', 
      title: 'Optimize Image Loading',
      description: 'Add lazy loading and WebP format for images',
      category: 'images',
      status: 'pending',
      impact: 'high',
      estimatedTime: '1-2 hours'
    },
    {
      id: '3',
      title: 'Add React.memo to Components',
      description: 'Prevent unnecessary re-renders in heavy components',
      category: 'components',
      status: 'pending',
      impact: 'medium',
      estimatedTime: '2-3 hours'
    },
    {
      id: '4',
      title: 'Optimize Touch Interactions',
      description: 'Improve button sizes and touch targets for mobile',
      category: 'mobile',
      status: 'pending',
      impact: 'medium',
      estimatedTime: '1-2 hours'
    },
    {
      id: '5',
      title: 'Implement Service Worker',
      description: 'Add caching strategy for offline functionality',
      category: 'caching',
      status: 'pending',
      impact: 'medium',
      estimatedTime: '3-4 hours'
    },
    {
      id: '6',
      title: 'Database Query Optimization',
      description: 'Optimize Supabase queries and add proper indexing',
      category: 'database',
      status: 'pending',
      impact: 'high',
      estimatedTime: '2-3 hours'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress': return <Clock className="w-4 h-4 text-blue-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'bundle': return <Package className="w-4 h-4" />;
      case 'images': return <ImageIcon className="w-4 h-4" />;
      case 'components': return <Code className="w-4 h-4" />;
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'caching': return <Wifi className="w-4 h-4" />;
      case 'database': return <Database className="w-4 h-4" />;
      default: return <Gauge className="w-4 h-4" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const overallProgress = Math.round(
    (optimizationTasks.filter(task => task.status === 'completed').length / optimizationTasks.length) * 100
  );

  const startOptimization = (taskId: string) => {
    setOptimizationTasks(prev => 
      prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'in-progress' }
          : task
      )
    );
    // Here we would implement the actual optimization logic
  };

  const runPerformanceAudit = () => {
    // Simulate running a performance audit
    console.log('Running performance audit...');
    // In a real implementation, this would:
    // 1. Analyze bundle size
    // 2. Check image optimization
    // 3. Measure loading times
    // 4. Test mobile responsiveness
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Zap className="w-8 h-8 text-primary" />
                Performance Optimization Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Optimize your app for speed, reliability, and native deployment
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={runPerformanceAudit} variant="outline">
              <Gauge className="w-4 h-4 mr-2" />
              Run Audit
            </Button>
            <Button onClick={() => navigate('/admin')} variant="ghost">
              Admin Dashboard
            </Button>
          </div>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Optimization Progress</span>
              <Badge variant="outline">{overallProgress}% Complete</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overallProgress} className="mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-green-600">
                  {optimizationTasks.filter(t => t.status === 'completed').length}
                </div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-blue-600">
                  {optimizationTasks.filter(t => t.status === 'in-progress').length}
                </div>
                <div className="text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-gray-600">
                  {optimizationTasks.filter(t => t.status === 'pending').length}
                </div>
                <div className="text-muted-foreground">Pending</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-primary">
                  {optimizationTasks.filter(t => t.impact === 'high').length}
                </div>
                <div className="text-muted-foreground">High Impact</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="metrics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Mobile
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Analysis
            </TabsTrigger>
          </TabsList>

          {/* Performance Metrics Tab */}
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {performanceMetrics.map((metric, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">{metric.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end justify-between mb-2">
                      <div className={`text-2xl font-bold ${getStatusColor(metric.status)}`}>
                        {metric.current}{metric.unit}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Target: {metric.target}{metric.unit}
                      </div>
                    </div>
                    <Progress 
                      value={Math.min((metric.target / metric.current) * 100, 100)} 
                      className="h-2"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Optimization Tasks Tab */}
          <TabsContent value="tasks">
            <div className="space-y-4">
              {optimizationTasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getCategoryIcon(task.category)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold">{task.title}</h3>
                            <Badge variant={getImpactColor(task.impact)}>
                              {task.impact} impact
                            </Badge>
                            {getStatusIcon(task.status)}
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            {task.description}
                          </p>
                          <div className="text-sm text-muted-foreground">
                            Estimated time: {task.estimatedTime}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => startOptimization(task.id)}
                          >
                            Start
                          </Button>
                        )}
                        {task.status === 'in-progress' && (
                          <Badge variant="secondary">In Progress</Badge>
                        )}
                        {task.status === 'completed' && (
                          <Badge variant="default">Completed</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Mobile Optimization Tab */}
          <TabsContent value="mobile">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mobile Performance Checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    'Touch targets minimum 44px',
                    'Responsive images with srcset',
                    'Optimized fonts for mobile',
                    'Reduced animation complexity',
                    'Efficient scroll handling',
                    'Native-feeling interactions'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded border border-muted-foreground" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Capacitor Readiness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    'Touch gesture optimization',
                    'Status bar handling',
                    'Safe area support',
                    'Native navigation patterns',
                    'Offline functionality',
                    'App lifecycle handling'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded border border-muted-foreground" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analysis Tab */}
          <TabsContent value="analysis">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bundle Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span>React & Core</span>
                        <span>45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span>UI Components</span>
                        <span>25%</span>
                      </div>
                      <Progress value={25} className="h-2" />
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span>Third-party Libraries</span>
                        <span>20%</span>
                      </div>
                      <Progress value={20} className="h-2" />
                    </div>
                    <div className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span>Application Code</span>
                        <span>10%</span>
                      </div>
                      <Progress value={10} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm text-red-600 mb-1">Critical</div>
                      <div className="text-sm">Implement lazy loading for route components</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm text-yellow-600 mb-1">Important</div>
                      <div className="text-sm">Optimize image formats and sizes</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm text-blue-600 mb-1">Enhancement</div>
                      <div className="text-sm">Add skeleton loading states</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PerformanceOptimization;