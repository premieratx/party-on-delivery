import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AITestingControl from '@/components/AITestingControl';
import { TestTelegramBot } from '@/components/TestTelegramBot';
import { Badge } from '@/components/ui/badge';

export const AIAgentContainer = () => {
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold">AI Testing Agent Project</h1>
          <Badge variant="secondary">In Development</Badge>
        </div>
        <p className="text-muted-foreground">
          Autonomous AI agent for testing web applications with GPT-4 Vision analysis and Telegram notifications
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="testing-control">Testing Control</TabsTrigger>
          <TabsTrigger value="telegram-setup">Telegram Setup</TabsTrigger>
          <TabsTrigger value="architecture">Architecture</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Status</CardTitle>
              <CardDescription>Current implementation progress</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">✅ Completed</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• AI Testing Agent Supabase function</li>
                    <li>• AI Coordinator function</li>
                    <li>• GPT-4 Vision integration</li>
                    <li>• Basic testing control UI</li>
                    <li>• Database schema for sessions/issues</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">🔄 In Progress</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Telegram bot webhook setup</li>
                    <li>• Screenshot capture mechanism</li>
                    <li>• Testing flow optimization</li>
                    <li>• Error handling improvements</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h5 className="font-medium mb-2">Autonomous Testing</h5>
                  <p className="text-muted-foreground">AI navigates and tests web apps automatically using predefined flows</p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">GPT-4 Vision Analysis</h5>
                  <p className="text-muted-foreground">Screenshots analyzed for UI/UX, functionality, and accessibility issues</p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Real-time Alerts</h5>
                  <p className="text-muted-foreground">Telegram notifications for critical issues and test results</p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Auto-fix Generation</h5>
                  <p className="text-muted-foreground">AI coordinator generates code fixes for identified issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testing-control">
          <AITestingControl />
        </TabsContent>

        <TabsContent value="telegram-setup">
          <TestTelegramBot />
        </TabsContent>

        <TabsContent value="architecture" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
              <CardDescription>High-level overview of the AI agent system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <h5 className="font-semibold mb-2">Testing Agent</h5>
                    <p className="text-sm text-muted-foreground">
                      Main agent that captures screenshots, analyzes with GPT-4, and reports issues
                    </p>
                    <p className="text-xs mt-2 font-mono">supabase/functions/ai-testing-agent/</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h5 className="font-semibold mb-2">AI Coordinator</h5>
                    <p className="text-sm text-muted-foreground">
                      Processes fix requests, generates code solutions, monitors system health
                    </p>
                    <p className="text-xs mt-2 font-mono">supabase/functions/ai-coordinator/</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h5 className="font-semibold mb-2">Control Interface</h5>
                    <p className="text-sm text-muted-foreground">
                      React components for starting/stopping tests and monitoring status
                    </p>
                    <p className="text-xs mt-2 font-mono">src/components/AITestingControl.tsx</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h5 className="font-semibold mb-3">Database Tables</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <code className="bg-muted p-2 rounded">testing_sessions</code>
                    <code className="bg-muted p-2 rounded">testing_issues</code>
                    <code className="bg-muted p-2 rounded">ai_fix_requests</code>
                    <code className="bg-muted p-2 rounded">system_health</code>
                    <code className="bg-muted p-2 rounded">performance_metrics</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};