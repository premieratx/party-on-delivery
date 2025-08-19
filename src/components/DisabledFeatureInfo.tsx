import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

interface DisabledFeatureInfoProps {
  title: string;
  description: string;
  features: string[];
}

export const DisabledFeatureInfo: React.FC<DisabledFeatureInfoProps> = ({
  title,
  description,
  features
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Disabled Features:</h4>
          <div className="flex flex-wrap gap-2">
            {features.map((feature) => (
              <Badge key={feature} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Benefits of Simplification</span>
          </div>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• Faster page load times</li>
            <li>• Reduced complexity and potential bugs</li>
            <li>• Easier debugging and maintenance</li>
            <li>• Lower resource usage</li>
            <li>• More focused user experience</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};