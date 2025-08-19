import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Settings } from 'lucide-react';
import { useAppConfig } from '@/hooks/useAppConfig';

export const DeactivatedFeaturesSummary: React.FC = () => {
  const { config } = useAppConfig();
  
  const features = [
    { key: 'googleMapsEnabled', name: 'Google Maps API', enabled: config.googleMapsEnabled },
    { key: 'abandonedOrderTrackingEnabled', name: 'Abandoned Order Tracking', enabled: config.abandonedOrderTrackingEnabled },
    { key: 'groupOrderingEnabled', name: 'Group Ordering', enabled: config.groupOrderingEnabled },
    { key: 'telegramBotEnabled', name: 'Telegram Bot', enabled: config.telegramBotEnabled },
    { key: 'aiBotAutomationsEnabled', name: 'AI Bot Automations', enabled: config.aiBotAutomationsEnabled },
    { key: 'voiceChatEnabled', name: 'Voice Chat', enabled: config.voiceChatEnabled },
    { key: 'speechModeEnabled', name: 'Speech Mode', enabled: config.speechModeEnabled },
    { key: 'stripePaymentsEnabled', name: 'Stripe Payments', enabled: config.stripePaymentsEnabled },
  ];

  const activeCount = features.filter(f => f.enabled).length;
  const inactiveCount = features.filter(f => !f.enabled).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          App Simplification Status
        </CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="text-green-600">
            <strong>{inactiveCount}</strong> features disabled for simplicity
          </div>
          <div className="text-orange-600">
            <strong>{activeCount}</strong> features currently active
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {features.map((feature) => (
            <div key={feature.key} className="flex items-center justify-between">
              <span className="text-sm">{feature.name}</span>
              <Badge variant={feature.enabled ? "destructive" : "secondary"}>
                {feature.enabled ? "Active" : "Disabled"}
              </Badge>
            </div>
          ))}
        </div>
        
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2 flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Simplification Benefits
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Faster loading and better performance</li>
            <li>• Reduced external dependencies and API calls</li>
            <li>• Cleaner debugging with fewer moving parts</li>
            <li>• More focused user experience</li>
            <li>• Lower security risk with fewer attack vectors</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};