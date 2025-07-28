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
  const [isRestarting, setIsRestarting] = useState(false);

  const handleGo = async () => {
    setIsStarting(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimization-automation', {
        body: { action: 'go' }
      });

      if (error) throw error;

      toast({
        title: "🚀 Full Automation Started!",
        description: `Starting ${data.total_tasks} tasks across ${data.total_phases} phases. Working autonomously without your input.`,
      });

    } catch (error) {
      console.error('Error starting automation:', error);
      toast({
        title: "Start Error",
        description: "Failed to start automation. Will try to fix and continue.",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  const handleRestart = async () => {
    setIsRestarting(true);
    try {
      const { data, error } = await supabase.functions.invoke('optimization-automation', {
        body: { action: 'restart' }
      });

      if (error) throw error;

      toast({
        title: "🔄 Automation Restarted!",
        description: data.message,
      });

    } catch (error) {
      console.error('Error restarting automation:', error);
      toast({
        title: "Restart Error",
        description: "Failed to restart automation.",
        variant: "destructive",
      });
    } finally {
      setIsRestarting(false);
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
            Automation Running Autonomously
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

            <div className="text-center p-3 bg-green-50 rounded border border-green-200">
              <div className="text-sm font-medium text-green-800 mb-1">
                🤖 Working Autonomously
              </div>
              <div className="text-xs text-green-600">
                The system is running all tasks automatically. It will fix problems and continue working without your input.
              </div>
            </div>

            <Button
              onClick={handleRestart}
              disabled={isRestarting}
              variant="outline"
              className="w-full"
            >
              {isRestarting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Restarting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Restart If Stuck
                </>
              )}
            </Button>
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
          Autonomous Automation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The automation will work through ALL tasks autonomously, fixing problems and continuing without your input.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleGo}
              disabled={isStarting}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Starting Complete Automation...
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  GO - Start Everything
                </>
              )}
            </Button>

            <Button
              onClick={handleRestart}
              disabled={isRestarting}
              variant="outline"
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isRestarting ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Restarting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  RESTART - Resume If Stuck
                </>
              )}
            </Button>
          </div>

          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-blue-800 space-y-1">
              <div className="font-medium">✅ Fully Autonomous Operation</div>
              <div>• Works through all 33+ optimization tasks</div>
              <div>• Handles errors and continues automatically</div>
              <div>• Logs all progress with timestamps</div>
              <div>• No manual input required</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};