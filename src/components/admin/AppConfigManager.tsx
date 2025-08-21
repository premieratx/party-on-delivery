import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAppConfig } from '@/hooks/useAppConfig';
import { useToast } from '@/hooks/use-toast';
import { Settings, MapPin, Archive, Users, MessageSquare, Bot, CreditCard } from 'lucide-react';

export const AppConfigManager: React.FC = () => {
  const { config, updateConfig, isLoading } = useAppConfig();
  const { toast } = useToast();

  const handleToggle = (key: keyof typeof config, value: boolean) => {
    updateConfig({ [key]: value });
    toast({
      title: "Settings Updated",
      description: `${key} has been ${value ? 'enabled' : 'disabled'}`,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            App Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          App Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Google Maps Configuration */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <Label htmlFor="google-maps-toggle" className="font-medium">
                Google Maps Integration
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Enable Google Places Autocomplete for address input in checkout
            </p>
          </div>
          <Switch
            id="google-maps-toggle"
            checked={config.googleMapsEnabled}
            onCheckedChange={(checked) => handleToggle('googleMapsEnabled', checked)}
          />
        </div>

        {/* Abandoned Order Tracking Configuration */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Archive className="w-4 h-4" />
              <Label htmlFor="abandoned-orders-toggle" className="font-medium">
                Abandoned Order Tracking
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Track incomplete checkouts for follow-up and analytics
            </p>
          </div>
          <Switch
            id="abandoned-orders-toggle"
            checked={config.abandonedOrderTrackingEnabled}
            onCheckedChange={(checked) => handleToggle('abandonedOrderTrackingEnabled', checked)}
          />
        </div>

        {/* Group Ordering Configuration */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <Label htmlFor="group-ordering-toggle" className="font-medium">
                Group Ordering
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Allow customers to create and join group orders with shared links
            </p>
          </div>
          <Switch
            id="group-ordering-toggle"
            checked={config.groupOrderingEnabled}
            onCheckedChange={(checked) => handleToggle('groupOrderingEnabled', checked)}
          />
        </div>

        {/* Telegram Bot Configuration */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <Label htmlFor="telegram-bot-toggle" className="font-medium">
                Telegram Bot Integration
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Enable Telegram bot for notifications and automated testing
            </p>
          </div>
          <Switch
            id="telegram-bot-toggle"
            checked={config.telegramBotEnabled}
            onCheckedChange={(checked) => handleToggle('telegramBotEnabled', checked)}
          />
        </div>

        {/* AI Bot Automations Configuration */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4" />
              <Label htmlFor="ai-bot-toggle" className="font-medium">
                AI Bot Automations
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Enable AI testing agents and automated monitoring systems
            </p>
          </div>
          <Switch
            id="ai-bot-toggle"
            checked={config.aiBotAutomationsEnabled}
            onCheckedChange={(checked) => handleToggle('aiBotAutomationsEnabled', checked)}
          />
        </div>

        {/* Stripe Payments Configuration */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <Label htmlFor="stripe-payments-toggle" className="font-medium">
                Stripe Payments
              </Label>
            </div>
            <p className="text-sm text-muted-foreground">
              Enable real payment processing via Stripe (requires API keys)
            </p>
          </div>
          <Switch
            id="stripe-payments-toggle"
            checked={config.stripePaymentsEnabled}
            onCheckedChange={(checked) => handleToggle('stripePaymentsEnabled', checked)}
          />
        </div>

        <div className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
          <strong>Note:</strong> These features are disabled by default for security and simplicity. 
          Enable only when you have properly configured the required API keys and services.
        </div>
      </CardContent>
    </Card>
  );
};