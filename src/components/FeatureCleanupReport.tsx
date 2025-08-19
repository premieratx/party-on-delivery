import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useAppConfig } from '@/hooks/useAppConfig';

export const FeatureCleanupReport: React.FC = () => {
  const { config } = useAppConfig();
  
  const features = [
    {
      name: 'Google Maps API',
      status: config.googleMapsEnabled ? 'enabled' : 'disabled',
      description: 'Address autocomplete functionality',
      impact: config.googleMapsEnabled ? 'API calls being made' : 'Using simple text input',
      recommendation: 'Keep disabled unless address validation is critical'
    },
    {
      name: 'Abandoned Order Tracking',
      status: config.abandonedOrderTrackingEnabled ? 'enabled' : 'disabled',
      description: 'Tracks incomplete checkout sessions',
      impact: config.abandonedOrderTrackingEnabled ? 'Database writes on checkout' : 'No tracking',
      recommendation: 'Keep disabled to reduce complexity'
    },
    {
      name: 'Group Ordering',
      status: config.groupOrderingEnabled ? 'enabled' : 'disabled',
      description: 'Shared cart and collaborative ordering',
      impact: config.groupOrderingEnabled ? 'Complex state management active' : 'Simplified checkout flow',
      recommendation: 'Keep disabled unless specifically needed'
    },
    {
      name: 'Telegram Bot',
      status: config.telegramBotEnabled ? 'enabled' : 'disabled',
      description: 'Automated notifications and interactions',
      impact: config.telegramBotEnabled ? 'External API integration' : 'No external dependencies',
      recommendation: 'Keep disabled to reduce external dependencies'
    },
    {
      name: 'AI Bot Automations',
      status: config.aiBotAutomationsEnabled ? 'enabled' : 'disabled',
      description: 'Automated testing and monitoring',
      impact: config.aiBotAutomationsEnabled ? 'Background processes running' : 'Manual testing only',
      recommendation: 'Keep disabled unless automated testing is required'
    },
    {
      name: 'Voice Chat',
      status: config.voiceChatEnabled ? 'enabled' : 'disabled',
      description: 'Voice-based customer interaction',
      impact: config.voiceChatEnabled ? 'Additional route and audio processing' : 'Text-only interface',
      recommendation: 'Keep disabled for simpler user experience'
    },
    {
      name: 'Speech Mode',
      status: config.speechModeEnabled ? 'enabled' : 'disabled',
      description: 'Text-to-speech functionality',
      impact: config.speechModeEnabled ? 'Audio processing overhead' : 'Visual interface only',
      recommendation: 'Keep disabled unless accessibility required'
    }
  ];

  const getStatusIcon = (status: string) => {
    if (status === 'enabled') return <XCircle className="w-4 h-4 text-red-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusBadge = (status: string) => {
    if (status === 'enabled') return <Badge variant="destructive">Enabled</Badge>;
    return <Badge variant="secondary">Disabled</Badge>;
  };

  const enabledCount = features.filter(f => f.status === 'enabled').length;
  const disabledCount = features.filter(f => f.status === 'disabled').length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Feature Cleanup Report
        </CardTitle>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{disabledCount} Simplified</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-4 h-4 text-red-500" />
            <span>{enabledCount} Complex</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {features.map((feature) => (
            <div key={feature.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(feature.status)}
                  <h3 className="font-medium">{feature.name}</h3>
                </div>
                {getStatusBadge(feature.status)}
              </div>
              
              <p className="text-sm text-muted-foreground mb-2">
                {feature.description}
              </p>
              
              <div className="text-xs space-y-1">
                <div>
                  <strong>Impact:</strong> <span className="text-muted-foreground">{feature.impact}</span>
                </div>
                <div>
                  <strong>Recommendation:</strong> <span className="text-muted-foreground">{feature.recommendation}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">Simplification Impact</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Reduced complexity and potential bugs</li>
            <li>• Fewer external API dependencies</li>
            <li>• Simpler debugging and maintenance</li>
            <li>• Better performance with fewer features running</li>
            <li>• More focused user experience</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};