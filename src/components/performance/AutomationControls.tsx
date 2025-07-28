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
      console.log('🚀 Starting full automation...');
      
      const { data, error } = await supabase.functions.invoke('optimization-automation', {
        body: { 
          action: 'go',
          session_name: 'Complete App Launch Automation'
        }
      });

      console.log('Automation response:', { data, error });

      if (error) {
        console.error('Automation error:', error);
        throw error;
      }

      toast({
        title: "🚀 Full Automation Started!",
        description: `Starting ${data.total_tasks || 'all'} tasks across ${data.total_phases || 6} phases. Working autonomously without your input.`,
      });

      // Also trigger the parent callback
      await onStartAutomation();

    } catch (error) {
      console.error('Error starting automation:', error);
      toast({
        title: "Start Error",
        description: "Failed to start automation. Starting fallback automation...",
        variant: "destructive",
      });
      
      // Try fallback
      try {
        await onStartAutomation();
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
      }
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
          <CardTitle className="flex items-center gap-2 text-blue-900 text-lg">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="hidden sm:inline">Automation Running Autonomously</span>
            <span className="sm:hidden">Running</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="hidden sm:inline">Progress: {session.completed_tasks}/{session.total_tasks} tasks</span>
                <span className="sm:hidden">{session.completed_tasks}/{session.total_tasks}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center">
                <div className="font-semibold text-green-600 text-lg sm:text-xl">{session.completed_tasks}</div>
                <div className="text-muted-foreground text-xs">Completed</div>
              </div>
              <div className="text-center">
                <div className="font-semibold text-red-600 text-lg sm:text-xl">{session.failed_tasks}</div>
                <div className="text-muted-foreground text-xs">Failed</div>
              </div>
            </div>

            {session.next_task_id && (
              <div className="p-3 bg-white rounded border">
                <div className="text-sm font-medium mb-1">
                  <span className="hidden sm:inline">Next Task:</span>
                  <span className="sm:hidden">Next:</span>
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground overflow-hidden text-ellipsis">
                  {session.next_task_id.length > 30 ? `${session.next_task_id.slice(0, 30)}...` : session.next_task_id}
                </div>
              </div>
            )}

            <div className="text-center p-3 bg-green-50 rounded border border-green-200">
              <div className="text-sm font-medium text-green-800 mb-1">
                🤖 <span className="hidden sm:inline">Working Autonomously</span><span className="sm:hidden">Auto Mode</span>
              </div>
              <div className="text-xs text-green-600">
                <span className="hidden sm:inline">
                  The system is running all tasks automatically. It will fix problems and continue working without your input.
                </span>
                <span className="sm:hidden">
                  Running automatically with error recovery
                </span>
              </div>
            </div>

            <Button
              onClick={handleRestart}
              disabled={isRestarting}
              variant="outline"
              className="w-full h-10 sm:h-9"
            >
              {isRestarting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Restarting...</span>
                  <span className="sm:hidden">Restarting</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Restart If Stuck</span>
                  <span className="sm:hidden">Restart</span>
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
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-primary" />
          <span className="hidden sm:inline">Autonomous Automation</span>
          <span className="sm:hidden">Automation</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <span className="hidden sm:inline">
              The automation will work through ALL tasks autonomously, fixing problems and continuing without your input.
            </span>
            <span className="sm:hidden">
              Works through all tasks autonomously with error recovery.
            </span>
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleGo}
              disabled={isStarting}
              className="w-full h-12 text-base sm:text-lg font-semibold"
              size="lg"
            >
              {isStarting ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Starting Complete Automation...</span>
                  <span className="sm:hidden">Starting...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">GO - Start Everything</span>
                  <span className="sm:hidden">GO</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleRestart}
              disabled={isRestarting}
              variant="outline"
              className="w-full h-12 text-base sm:text-lg"
              size="lg"
            >
              {isRestarting ? (
                <>
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Restarting...</span>
                  <span className="sm:hidden">Restarting</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-5 h-5 mr-2" />
                  <span className="hidden sm:inline">RESTART - Resume If Stuck</span>
                  <span className="sm:hidden">RESTART</span>
                </>
              )}
            </Button>
          </div>

          <div className="p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-xs text-blue-800 space-y-1">
              <div className="font-medium">✅ <span className="hidden sm:inline">Fully Autonomous Operation</span><span className="sm:hidden">Autonomous</span></div>
              <div className="space-y-1">
                <div>• <span className="hidden sm:inline">Works through all 33+ optimization tasks</span><span className="sm:hidden">33+ optimization tasks</span></div>
                <div>• <span className="hidden sm:inline">Handles errors and continues automatically</span><span className="sm:hidden">Auto error handling</span></div>
                <div>• <span className="hidden sm:inline">Logs all progress with timestamps</span><span className="sm:hidden">Detailed logging</span></div>
                <div>• <span className="hidden sm:inline">No manual input required</span><span className="sm:hidden">No input needed</span></div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};