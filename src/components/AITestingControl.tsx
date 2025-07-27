import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AITestingControl = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testingStatus, setTestingStatus] = useState<'idle' | 'running' | 'paused'>('idle');
  const [telegramSetup, setTelegramSetup] = useState(false);

  const startTesting = async () => {
    setIsLoading(true);
    try {
      console.log('Starting AI testing agent...');
      
      const { data, error } = await supabase.functions.invoke('ai-testing-agent', {
        body: {
          action: 'start_testing',
          data: {
            appUrl: window.location.origin,
            flows: ['homepage', 'delivery_widget', 'party_planner', 'checkout_flow', 'admin_dashboard']
          }
        }
      });

      if (error) throw error;

      setTestingStatus('running');
      toast.success('🤖 AI Testing Agent Started!', {
        description: 'Continuous testing and monitoring is now active. Check Telegram for updates!'
      });

      console.log('Testing session started:', data);

    } catch (error: any) {
      console.error('Failed to start testing:', error);
      toast.error('Failed to start AI testing', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopTesting = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-testing-agent', {
        body: {
          action: 'stop_testing',
          data: {}
        }
      });

      if (error) throw error;

      setTestingStatus('paused');
      toast.success('Testing paused', {
        description: 'AI testing agent has been stopped'
      });

    } catch (error: any) {
      console.error('Failed to stop testing:', error);
      toast.error('Failed to stop testing', {
        description: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('ai-testing-agent', {
        body: {
          action: 'get_status',
          data: {}
        }
      });

      if (error) throw error;

      console.log('Current status:', data);
      
      if (data.session) {
        setTestingStatus(data.session.status);
        toast.success(`Status: ${data.session.status}`, {
          description: `Current flow: ${data.session.currentFlow}, Uptime: ${Math.floor(data.uptime / 60000)} minutes`
        });
      } else {
        setTestingStatus('idle');
        toast.info('No active testing session');
      }

    } catch (error: any) {
      console.error('Failed to get status:', error);
      toast.error('Failed to get status', {
        description: error.message
      });
    }
  };

  const setupTelegramBot = async () => {
    toast.success('🤖 Telegram Bot Setup', {
      description: 'Instructions: 1) Search for your bot on Telegram, 2) Send /start to activate, 3) You\'ll receive testing alerts!'
    });
    setTelegramSetup(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🤖 AI Testing Agent Control Panel
          </CardTitle>
          <CardDescription>
            Your autonomous AI testing agent that monitors your app 24/7, finds issues, suggests fixes, and communicates via Telegram
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {testingStatus === 'running' ? '🟢' : testingStatus === 'paused' ? '🟡' : '⭕'}
              </div>
              <div className="text-sm font-medium">
                {testingStatus === 'running' ? 'ACTIVE' : testingStatus === 'paused' ? 'PAUSED' : 'INACTIVE'}
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">📱</div>
              <div className="text-sm font-medium">
                {telegramSetup ? 'TELEGRAM READY' : 'SETUP NEEDED'}
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">🔧</div>
              <div className="text-sm font-medium">AUTO-FIX READY</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={startTesting} 
              disabled={isLoading || testingStatus === 'running'}
              className="bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isLoading ? '🔄 Starting...' : '🚀 Start AI Testing'}
            </Button>

            <Button 
              onClick={stopTesting} 
              disabled={isLoading || testingStatus === 'idle'}
              variant="destructive"
              size="lg"
            >
              {isLoading ? '⏸️ Stopping...' : '⏹️ Stop Testing'}
            </Button>

            <Button 
              onClick={checkStatus} 
              variant="outline"
              size="lg"
            >
              📊 Check Status
            </Button>

            <Button 
              onClick={setupTelegramBot} 
              variant="outline"
              size="lg"
              className={telegramSetup ? 'bg-green-50' : ''}
            >
              📱 Setup Telegram
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🎯 What the AI Testing Agent Does</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">🔍 Automated Testing</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Tests all app flows every 5 minutes</li>
                <li>• Takes screenshots and analyzes with GPT-4 Vision</li>
                <li>• Detects UI/UX issues and bugs</li>
                <li>• Monitors performance and accessibility</li>
                <li>• Runs 24/7 without human intervention</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📱 Telegram Integration</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Instant alerts for critical issues</li>
                <li>• Chat with your AI agent anytime</li>
                <li>• Get screenshots and analysis reports</li>
                <li>• Request specific tests or fixes</li>
                <li>• Coordinate with development AI</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🔧 Auto-Fix Generation</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• AI generates specific code fixes</li>
                <li>• Prioritizes critical issues</li>
                <li>• Suggests improvements and optimizations</li>
                <li>• Creates test versions automatically</li>
                <li>• Coordinates with main development AI</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Performance Monitoring</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Tracks app performance metrics</li>
                <li>• Monitors load times and errors</li>
                <li>• Analyzes user experience flows</li>
                <li>• Provides detailed health reports</li>
                <li>• Alerts on performance degradation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📱 Telegram Bot Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Step 1: Find Your Bot</h4>
              <p className="text-sm">
                Search for your Telegram bot (you'll need to create one using @BotFather first) 
                and send <code className="bg-gray-200 px-1 rounded">/start</code> to activate it.
              </p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Step 2: Chat Commands</h4>
              <div className="text-sm space-y-1">
                <p><code>/status</code> - Check testing status</p>
                <p><code>/issues</code> - Show recent issues</p>
                <p><code>/start_testing</code> - Begin testing</p>
                <p><code>/stop_testing</code> - Pause testing</p>
                <p>Or just chat naturally: "How is the app?" "Any new issues?"</p>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Step 3: Get Alerts</h4>
              <p className="text-sm">
                You'll receive instant notifications for critical issues, 
                performance problems, and when fixes are generated. 
                The AI will also send you screenshots and analysis reports.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITestingControl;