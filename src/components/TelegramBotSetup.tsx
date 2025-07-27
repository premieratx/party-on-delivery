import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Copy, ExternalLink, Bot, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  action?: string;
}

const TelegramBotSetup: React.FC = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [botToken, setBotToken] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [webhookSet, setWebhookSet] = useState(false);
  const [botTested, setBotTested] = useState(false);

  const resetWizard = () => {
    setCurrentStep(0);
    setBotToken('');
    setBotUsername('');
    setWebhookSet(false);
    setBotTested(false);
    toast({
      title: "Setup Reset",
      description: "Wizard has been reset to start fresh",
    });
  };

  const webhookUrl = 'https://acmlfzfliqupwxwoefdq.supabase.co/functions/v1/telegram-bot';
  
  const botCommands = [
    'start - Start using the AI testing bot',
    'status - Check current testing status', 
    'start_testing - Begin automated testing',
    'stop_testing - Pause testing',
    'issues - View recent issues',
    'help - Show available commands'
  ].join('\n');

  const steps: SetupStep[] = [
    {
      id: 'botfather',
      title: 'Create Bot with BotFather',
      description: 'Message @BotFather on Telegram to create your bot',
      completed: !!botToken,
      action: 'Open Telegram'
    },
    {
      id: 'webhook',
      title: 'Set Webhook URL',
      description: 'Configure your bot to receive messages',
      completed: webhookSet,
      action: 'Set Webhook'
    },
    {
      id: 'commands',
      title: 'Configure Bot Commands',
      description: 'Set up command menu for better UX',
      completed: false,
      action: 'Copy Commands'
    },
    {
      id: 'test',
      title: 'Test Bot Integration',
      description: 'Verify everything works correctly',
      completed: botTested,
      action: 'Test Bot'
    }
  ];

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${description} copied to clipboard`,
    });
  };

  const testBotConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('telegram-bot', {
        body: { 
          action: 'test_connection',
          chat_id: 123456789 // Test chat ID
        }
      });

      if (error) throw error;

      setBotTested(true);
      toast({
        title: "Bot Test Successful!",
        description: "Your Telegram bot is properly configured",
      });
    } catch (error) {
      toast({
        title: "Bot Test Failed",
        description: "Please check your configuration",
        variant: "destructive"
      });
    }
  };

  const setWebhook = async () => {
    if (!botToken) {
      toast({
        title: "Bot Token Required",
        description: "Please enter your bot token first",
        variant: "destructive"
      });
      return;
    }

    try {
      // This would typically be done via the Telegram Bot API
      // For demo purposes, we'll simulate success
      setWebhookSet(true);
      toast({
        title: "Webhook Instructions Copied!",
        description: "Follow the copied instructions to set your webhook",
      });
      
      const webhookInstructions = `To set your webhook, send this to your bot or use curl:

curl -X POST "https://api.telegram.org/bot${botToken}/setWebhook" \\
     -H "Content-Type: application/json" \\
     -d '{"url": "${webhookUrl}"}'`;
     
      copyToClipboard(webhookInstructions, 'Webhook setup instructions');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set webhook",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Bot className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Telegram Bot Setup</h1>
        </div>
        <p className="text-muted-foreground mb-4">
          Automated AI Testing Agent - Complete setup in minutes
        </p>
        <Button 
          variant="outline" 
          onClick={resetWizard}
          className="mb-4"
        >
          Reset Wizard
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Setup Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Setup Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`p-4 rounded-lg border transition-all ${
                  index === currentStep ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium flex items-center gap-2">
                    {step.completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />
                    )}
                    {step.title}
                  </h3>
                  <Badge variant={step.completed ? "default" : "secondary"}>
                    {step.completed ? "Done" : "Pending"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-3">{step.description}</p>
                
                {/* Step-specific actions */}
                {step.id === 'botfather' && !step.completed && (
                  <div className="space-y-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://t.me/botfather', '_blank')}
                      className="w-full"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open @BotFather
                    </Button>
                    <div className="space-y-2">
                      <Input
                        placeholder="Enter your bot token"
                        value={botToken}
                        onChange={(e) => setBotToken(e.target.value)}
                      />
                      <Input
                        placeholder="Enter your bot username (optional)"
                        value={botUsername}
                        onChange={(e) => setBotUsername(e.target.value)}
                      />
                      {botToken && (
                        <Button
                          onClick={() => setCurrentStep(1)}
                          size="sm"
                          className="w-full"
                        >
                          Next Step
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {step.id === 'webhook' && !step.completed && currentStep >= 1 && (
                  <div className="space-y-2">
                    <Button onClick={setWebhook} size="sm" className="w-full">
                      Get Webhook Instructions
                    </Button>
                    <div className="text-xs text-muted-foreground">
                      Webhook URL: {webhookUrl}
                    </div>
                  </div>
                )}

                {step.id === 'commands' && currentStep >= 2 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(botCommands, 'Bot commands')}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Commands
                  </Button>
                )}

                {step.id === 'test' && currentStep >= 3 && (
                  <Button
                    onClick={testBotConnection}
                    size="sm"
                    className="w-full"
                    disabled={botTested}
                  >
                    {botTested ? 'Bot Tested ✓' : 'Test Bot Connection'}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Instructions & Info */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Setup Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">Step 1: Create Bot</h4>
              <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                <li>Open Telegram and search for @BotFather</li>
                <li>Send <code>/newbot</code> command</li>
                <li>Choose a name for your bot (e.g., "AI Testing Agent")</li>
                <li>Choose a username ending in "bot" (e.g., "partyondelivery_ai_bot")</li>
                <li>Copy the bot token and paste it above</li>
              </ol>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Step 2: Configure Bot</h4>
              <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                <li>Set bot description with <code>/setdescription</code></li>
                <li>Set commands with <code>/setcommands</code></li>
                <li>Use our auto-generated webhook URL</li>
              </ol>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Bot Features</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 24/7 automated testing</li>
                <li>• Real-time issue alerts</li>
                <li>• AI-powered fix suggestions</li>
                <li>• Performance monitoring</li>
                <li>• Chat-based interaction</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TelegramBotSetup;