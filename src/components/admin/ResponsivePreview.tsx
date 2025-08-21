import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface ResponsivePreviewProps {
  children: React.ReactNode;
  title?: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile' | 'galaxy';

const deviceConfigs = {
  desktop: {
    name: 'Desktop',
    icon: Monitor,
    width: '100%',
    height: '600px',
    className: 'border-2 border-muted rounded-lg'
  },
  tablet: {
    name: 'Tablet',
    icon: Tablet,
    width: '768px',
    height: '1024px',
    className: 'border-2 border-muted rounded-lg'
  },
  mobile: {
    name: 'iPhone 14',
    icon: Smartphone,
    width: '390px',
    height: '844px',
    className: 'border-2 border-muted rounded-[2rem] border-gray-800'
  },
  galaxy: {
    name: 'Samsung Galaxy S23',
    icon: Smartphone,
    width: '360px',
    height: '780px',
    className: 'border-2 border-muted rounded-[1.5rem] border-gray-800'
  }
};

export const ResponsivePreview: React.FC<ResponsivePreviewProps> = ({
  children,
  title = "Preview"
}) => {
  const [activeDevice, setActiveDevice] = useState<DeviceType>('desktop');

  const currentConfig = deviceConfigs[activeDevice];
  const IconComponent = currentConfig.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex gap-2">
            {Object.entries(deviceConfigs).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant={activeDevice === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveDevice(key as DeviceType)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {config.name}
                </Button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <IconComponent className="w-3 h-3" />
            {currentConfig.name}
          </Badge>
          <Badge variant="secondary">
            {currentConfig.width} × {currentConfig.height}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg">
          <div
            className={`${currentConfig.className} overflow-hidden bg-white dark:bg-gray-900 shadow-xl`}
            style={{
              width: currentConfig.width,
              height: currentConfig.height,
              maxWidth: '100%',
              resize: activeDevice === 'desktop' ? 'both' : 'none'
            }}
          >
            <div className="w-full h-full overflow-auto">
              {children}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};