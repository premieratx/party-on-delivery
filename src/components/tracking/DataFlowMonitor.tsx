import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDataFlowTracking } from '@/hooks/useDataFlowTracking';
import { CheckCircle, AlertCircle, Clock, ArrowRight, Eye, EyeOff } from 'lucide-react';

interface DataFlowMonitorProps {
  alwaysVisible?: boolean;
}

export const DataFlowMonitor: React.FC<DataFlowMonitorProps> = ({ alwaysVisible = false }) => {
  const { flowData, events, getFlowSummary, validateFlow } = useDataFlowTracking();
  const [isVisible, setIsVisible] = useState(alwaysVisible);
  const [summary, setSummary] = useState<any>(null);
  const [validation, setValidation] = useState<any>(null);

  useEffect(() => {
    const updateSummary = () => {
      setSummary(getFlowSummary());
      setValidation(validateFlow());
    };

    updateSummary();
    const interval = setInterval(updateSummary, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [getFlowSummary, validateFlow]);

  if (!isVisible && !alwaysVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/90 backdrop-blur-sm"
        >
          <Eye className="w-4 h-4 mr-2" />
          Data Flow
        </Button>
      </div>
    );
  }

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'cover_page_view':
        return '👁️';
      case 'button_click':
        return '👆';
      case 'delivery_app_enter':
        return '🏪';
      case 'checkout_start':
        return '🛒';
      case 'order_complete':
        return '✅';
      default:
        return '📝';
    }
  };

  const getStatusColor = () => {
    if (!validation) return 'default';
    if (summary?.isComplete) return 'default';
    if (!validation.isHealthy) return 'destructive';
    return 'default';
  };

  return (
    <div className={`${alwaysVisible ? 'w-full' : 'fixed bottom-4 right-4 w-96'} z-50`}>
      <Card className="bg-background/95 backdrop-blur-sm border shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Data Flow Monitor
            </CardTitle>
            {!alwaysVisible && (
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
            )}
          </div>
          
          {validation && (
            <div className="flex items-center gap-2">
              <Badge variant={getStatusColor()}>
                {validation.isHealthy ? (
                  <CheckCircle className="w-3 h-3 mr-1" />
                ) : (
                  <AlertCircle className="w-3 h-3 mr-1" />
                )}
                {summary?.isComplete ? 'Complete' : validation.isHealthy ? 'Healthy' : 'Issues'}
              </Badge>
              
              {summary?.duration && (
                <Badge variant="outline" className="text-xs">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDuration(summary.duration)}
                </Badge>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Flow Data Summary */}
          {flowData && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Current Flow</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {flowData.coverPageSlug && (
                  <div>
                    <span className="text-muted-foreground">Cover:</span>
                    <div className="font-mono">{flowData.coverPageSlug}</div>
                  </div>
                )}
                {flowData.deliveryAppSlug && (
                  <div>
                    <span className="text-muted-foreground">App:</span>
                    <div className="font-mono">{flowData.deliveryAppSlug}</div>
                  </div>
                )}
                {flowData.affiliateCode && (
                  <div>
                    <span className="text-muted-foreground">Affiliate:</span>
                    <div className="font-mono">{flowData.affiliateCode}</div>
                  </div>
                )}
                {(flowData.markupPercentage || flowData.markupDollarAmount) && (
                  <div>
                    <span className="text-muted-foreground">Markup:</span>
                    <div className="font-mono">
                      {flowData.markupPercentage ? `${flowData.markupPercentage}%` : `$${flowData.markupDollarAmount}`}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Event Timeline */}
          {events.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Event Timeline</h4>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {events.slice(-5).map((event, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs p-2 bg-muted/50 rounded">
                    <span>{getEventIcon(event.type)}</span>
                    <div className="flex-1">
                      <div className="font-semibold">{event.type.replace(/_/g, ' ')}</div>
                      <div className="text-muted-foreground">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    {event.data && (
                      <div className="text-xs text-muted-foreground">
                        {Object.keys(event.data).length} props
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Validation Status */}
          {validation && !validation.isHealthy && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-destructive">Issues Detected</h4>
              <div className="space-y-1 text-xs">
                {!validation.hasSession && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    No active session
                  </div>
                )}
                {!validation.hasTracking && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-3 h-3" />
                    No tracking events
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 border-t">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => console.log('Flow Data:', { flowData, events, summary, validation })}
                className="text-xs"
              >
                Log Details
              </Button>
              {summary?.isComplete && (
                <Badge variant="default" className="text-xs bg-green-500 text-white">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Flow Complete
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};