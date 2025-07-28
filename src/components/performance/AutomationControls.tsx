import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Zap,
  TrendingUp
} from 'lucide-react';

interface AutomationControlsProps {
  onStartAutomation: () => void;
  isRunning: boolean;
  session: any;
}

export const AutomationControls: React.FC<AutomationControlsProps> = ({
  onStartAutomation,
  isRunning,
  session
}) => {
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await onStartAutomation();
    } finally {
      setIsStarting(false);
    }
  };

  const runSingleTask = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('optimization-automation', {
        body: { action: 'run_next_task' }
      });

      if (error) throw error;

      toast({
        title: data.session_completed ? "🎉 Session Complete!" : "✅ Task Completed",
        description: data.message,
      });

    } catch (error) {
      console.error('Error running single task:', error);
      toast({
        title: "Task Error",
        description: "Failed to run optimization task.",
        variant: "destructive",
      });
    }
  };

  if (isRunning && session) {
    const progress = session.total_tasks > 0 ? 
      (session.completed_tasks / session.total_tasks) * 100 : 0;

    return (
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Automation Running
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress: {session.completed_tasks}/{session.total_tasks} tasks</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-green-600">{session.completed_tasks}</div>
                <div className="text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-600">{session.failed_tasks}</div>
                <div className="text-muted-foreground">Failed</div>
              </div>
            </div>

            {session.next_task_id && (
              <div className="p-3 bg-white rounded border">
                <div className="text-sm font-medium mb-1">Next Task:</div>
                <div className="text-sm text-muted-foreground">{session.next_task_id}</div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={runSingleTask}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Run Next Task
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          Automation Controls
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Start the automated optimization engine to systematically improve your app's performance.
          </p>

          <div className="space-y-2">
            <Button
              onClick={handleStart}
              disabled={isStarting}
              className="w-full"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Start Full Automation
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={runSingleTask}
              className="w-full"
            >
              <Clock className="w-4 h-4 mr-2" />
              Run Single Task
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            The automation will systematically work through each optimization task, 
            logging progress and results in real-time.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};