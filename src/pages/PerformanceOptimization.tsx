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
  Wifi,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { AutomationControls } from '@/components/performance/AutomationControls';

interface OptimizationTask {
  id: string;
  task_id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  estimated_time: string;
  automation_capable: boolean;
  prerequisites: string[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface AutomationSession {
  id: string;
  session_name: string;
  status: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  next_task_id?: string;
  started_at: string;
  completed_at?: string;
}

const PerformanceOptimization = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [optimizationTasks, setOptimizationTasks] = useState<OptimizationTask[]>([]);
  const [automationSession, setAutomationSession] = useState<AutomationSession | null>(null);
  const [isAutomationRunning, setIsAutomationRunning] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);
  const [conversationLogs, setConversationLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUserActivity, setLastUserActivity] = useState(Date.now());
  const [automationPaused, setAutomationPaused] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<any>(null);

  // Load data from Supabase and setup real-time updates
  useEffect(() => {
    loadOptimizationData();
    setupRealtimeUpdates();
    setupUserActivityDetection();
    loadConversationLogs();
  }, []);

  // User activity detection
  useEffect(() => {
    const handleActivity = () => {
      setLastUserActivity(Date.now());
      if (automationPaused) {
        setAutomationPaused(false);
        toast({
          title: "👋 Welcome back!",
          description: "Automation will continue after your approval.",
        });
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [automationPaused]);

  const setupRealtimeUpdates = () => {
    // Listen for optimization log updates
    const logChannel = supabase
      .channel('optimization-logs-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'optimization_logs'
        },
        (payload) => {
          console.log('New log received:', payload.new);
          setLogs(prev => [payload.new, ...prev.slice(0, 19)]);
          
          // Check if it's a conversation log
          if (payload.new.task_id === 'CONVERSATION') {
            setConversationLogs(prev => [payload.new, ...prev.slice(0, 49)]);
          }
        }
      )
      .subscribe();

    // Listen for task updates
    const taskChannel = supabase
      .channel('task-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'optimization_tasks'
        },
        (payload) => {
          console.log('Task updated:', payload.new);
          setOptimizationTasks(prev => 
            prev.map(task => 
              task.id === payload.new.id ? payload.new as OptimizationTask : task
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(logChannel);
      supabase.removeChannel(taskChannel);
    };
  };

  const setupUserActivityDetection = () => {
    const checkUserActivity = () => {
      const timeSinceActivity = Date.now() - lastUserActivity;
      const isUserActive = timeSinceActivity < 10000; // 10 seconds threshold
      
      if (isUserActive && isAutomationRunning && !automationPaused) {
        setAutomationPaused(true);
        setPendingApproval({
          message: "Automation paused - you're actively using the app. Ready for manual approval?",
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "⏸️ Automation Paused",
          description: "Detected user activity. Automation will wait for your approval.",
        });
      }
    };

    const interval = setInterval(checkUserActivity, 5000);
    return () => clearInterval(interval);
  };

  const loadConversationLogs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('optimization-automation', {
        body: { action: 'get_conversation_logs' }
      });

      if (!error && data.logs) {
        setConversationLogs(data.logs);
      }
    } catch (error) {
      console.error('Error loading conversation logs:', error);
    }
  };

  const approveNextStep = async () => {
    if (!pendingApproval) return;
    
    setPendingApproval(null);
    setAutomationPaused(false);
    
    toast({
      title: "✅ Approved",
      description: "Automation will continue in autonomous mode.",
    });
  };

  const loadOptimizationData = async () => {
    try {
      setLoading(true);
      
      // Load tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('optimization_tasks')
        .select('*')
        .order('priority', { ascending: true });

      if (tasksError) throw tasksError;
      setOptimizationTasks(tasks || []);

      // Load active session
      const { data: session, error: sessionError } = await supabase
        .from('automation_sessions')
        .select('*')
        .eq('status', 'running')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (!sessionError && session) {
        setAutomationSession(session);
        setIsAutomationRunning(true);
      }

      // Load recent logs
      const { data: recentLogs, error: logsError } = await supabase
        .from('optimization_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!logsError) {
        setLogs(recentLogs || []);
      }

    } catch (error) {
      console.error('Error loading optimization data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load optimization data from database.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const startAutomation = async () => {
    try {
      setIsAutomationRunning(true);
      
      const { data, error } = await supabase.functions.invoke('optimization-automation', {
        body: {
          action: 'start_automation_session',
          session_name: 'Performance Optimization Automation'
        }
      });

      if (error) throw error;

      toast({
        title: "🤖 Automation Started",
        description: `Started optimization session with ${data.total_tasks} tasks`,
      });

      // Refresh data
      await loadOptimizationData();
      
      // Start continuous monitoring
      runAutomationLoop();
      
    } catch (error) {
      console.error('Error starting automation:', error);
      setIsAutomationRunning(false);
      toast({
        title: "Automation Error",
        description: "Failed to start automation session.",
        variant: "destructive",
      });
    }
  };

  const runAutomationLoop = async () => {
    const runNextTask = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('optimization-automation', {
          body: { action: 'run_next_task' }
        });

        if (error) throw error;

        await loadOptimizationData();

        if (data.session_completed) {
          setIsAutomationRunning(false);
          toast({
            title: "🎉 Automation Complete!",
            description: "All optimization tasks have been completed.",
          });
        } else {
          // Continue to next task after a delay
          setTimeout(runNextTask, 3000);
        }

      } catch (error) {
        console.error('Error running automation task:', error);
        setIsAutomationRunning(false);
        toast({
          title: "Automation Error", 
          description: "An error occurred during automation.",
          variant: "destructive",
        });
      }
    };

    // Start the loop
    setTimeout(runNextTask, 1000);
  };

  const runSpecificTask = async (taskId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('optimization-automation', {
        body: {
          action: 'run_specific_task',
          task_id: taskId
        }
      });

      if (error) throw error;

      toast({
        title: data.success ? "✅ Task Completed" : "❌ Task Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });

      await loadOptimizationData();

    } catch (error) {
      console.error('Error running specific task:', error);
      toast({
        title: "Task Error",
        description: "Failed to run the optimization task.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'blocked': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in-progress': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const overallProgress = optimizationTasks.length > 0 
    ? Math.round((optimizationTasks.filter(task => task.status === 'completed').length / optimizationTasks.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading optimization dashboard...</p>
        </div>
      </div>
    );
  }

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
            {!isAutomationRunning ? (
              <Button onClick={startAutomation} variant="outline">
                <Play className="w-4 h-4 mr-2" />
                Start Automation
              </Button>
            ) : (
              <Button variant="outline" disabled>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running...
              </Button>
            )}
            <Button onClick={() => navigate('/admin')} variant="ghost">
              Admin Dashboard
            </Button>
          </div>
        </div>

        {/* Automation Controls Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <AutomationControls
              onStartAutomation={startAutomation}
              isRunning={isAutomationRunning}
              session={automationSession}
            />
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>System Status</span>
                  <div className="flex items-center gap-2">
                    {isAutomationRunning ? (
                      <Badge variant="default" className="animate-pulse">
                        🤖 Active
                      </Badge>
                    ) : (
                      <Badge variant="outline">Idle</Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/50 rounded">
                      <div className="text-2xl font-bold text-primary">
                        {optimizationTasks.filter(t => t.status === 'completed').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Tasks Completed</div>
                    </div>
                    <div className="text-center p-4 bg-muted/50 rounded">
                      <div className="text-2xl font-bold text-muted-foreground">
                        {optimizationTasks.filter(t => t.status === 'pending').length}
                      </div>
                      <div className="text-sm text-muted-foreground">Tasks Remaining</div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    The automation engine analyzes your codebase and provides detailed 
                    recommendations for performance improvements. Each task includes 
                    specific implementation guidance and impact estimates.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pending Approval Banner */}
        {pendingApproval && (
          <Card className="border-orange-200 bg-orange-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Pause className="w-5 h-5 text-orange-600" />
                  <div>
                    <h3 className="font-semibold text-orange-800">Automation Paused</h3>
                    <p className="text-sm text-orange-700">{pendingApproval.message}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={approveNextStep}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve & Continue
                  </Button>
                  <Button
                    onClick={() => setPendingApproval(null)}
                    size="sm"
                    variant="outline"
                  >
                    Keep Paused
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="progress" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="tasks" className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              System Logs
            </TabsTrigger>
            <TabsTrigger value="conversation" className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Conversation
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Mobile
            </TabsTrigger>
          </TabsList>

          {/* Real-time Progress Tab */}
          <TabsContent value="progress">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Automation Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center p-6 bg-muted/50 rounded-lg">
                      <div className="text-3xl font-bold text-primary mb-2">
                        {overallProgress}%
                      </div>
                      <div className="text-sm text-muted-foreground mb-3">Overall Progress</div>
                      <Progress value={overallProgress} className="h-3" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded border border-green-200">
                        <div className="text-xl font-bold text-green-600">
                          {optimizationTasks.filter(t => t.status === 'completed').length}
                        </div>
                        <div className="text-xs text-green-700">Completed</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded border border-blue-200">
                        <div className="text-xl font-bold text-blue-600">
                          {optimizationTasks.filter(t => t.status === 'pending').length}
                        </div>
                        <div className="text-xs text-blue-700">Remaining</div>
                      </div>
                    </div>

                    {isAutomationRunning && (
                      <div className="p-3 bg-blue-50 rounded border border-blue-200 text-center">
                        <div className="text-sm font-medium text-blue-800 mb-1">
                          🤖 Working Autonomously
                        </div>
                        <div className="text-xs text-blue-600">
                          System is running all tasks automatically with error recovery
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {conversationLogs.slice(0, 10).map((log, index) => (
                      <div 
                        key={log.id || index}
                        className="p-3 rounded-lg bg-muted/50 border border-muted"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {log.log_level === 'system' ? '🤖' : 
                                 log.log_level === 'success' ? '✅' :
                                 log.log_level === 'error' ? '❌' : '📝'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(log.created_at).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm">{log.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {conversationLogs.length === 0 && (
                      <div className="text-center py-6 text-muted-foreground">
                        No conversation logs yet. Click "GO" to start automation.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Conversation Logs Tab */}
          <TabsContent value="conversation">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Complete Conversation Log
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadConversationLogs}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {conversationLogs.map((log, index) => (
                    <div 
                      key={log.id || index}
                      className={`p-4 rounded-lg border-l-4 ${
                        log.log_level === 'error' ? 'border-red-500 bg-red-50' :
                        log.log_level === 'success' ? 'border-green-500 bg-green-50' :
                        log.log_level === 'system' ? 'border-blue-500 bg-blue-50' :
                        'border-gray-500 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              {log.log_level === 'system' ? '🤖 System' :
                               log.log_level === 'success' ? '✅ Success' :
                               log.log_level === 'error' ? '❌ Error' : '📝 Info'}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(log.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{log.message}</p>
                          {log.details?.timestamp && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Session: {log.details.session_id?.slice(0, 8)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {conversationLogs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No conversation logs available yet. Start automation to see detailed progress.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Metrics Tab */}
          <TabsContent value="metrics">
            <div className="text-center py-12">
              <Monitor className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Performance Metrics</h3>
              <p className="text-muted-foreground">
                Real-time performance metrics will be available after automation runs.
              </p>
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
                            <Badge variant={getPriorityColor(task.priority)}>
                              {task.priority} priority
                            </Badge>
                            {getStatusIcon(task.status)}
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            {task.description}
                          </p>
                          <div className="text-sm text-muted-foreground">
                            Estimated time: {task.estimated_time}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {task.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => runSpecificTask(task.task_id)}
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

          {/* Real-time Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Real-time Optimization Logs
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadOptimizationData}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No logs available yet. Start automation to see progress logs.
                    </div>
                  ) : (
                    logs.map((log, index) => (
                      <div 
                        key={log.id || index} 
                        className={`p-3 rounded border-l-4 ${
                          log.log_level === 'error' ? 'border-red-500 bg-red-50' :
                          log.log_level === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                          log.log_level === 'success' ? 'border-green-500 bg-green-50' :
                          'border-blue-500 bg-blue-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline" className="text-xs">
                                {log.task_id || 'system'}
                              </Badge>
                              <span className={`text-xs font-medium ${
                                log.log_level === 'error' ? 'text-red-600' :
                                log.log_level === 'warning' ? 'text-yellow-600' :
                                log.log_level === 'success' ? 'text-green-600' :
                                'text-blue-600'
                              }`}>
                                {log.log_level?.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-sm text-foreground">{log.message}</p>
                            {log.details && Object.keys(log.details).length > 0 && (
                              <pre className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
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