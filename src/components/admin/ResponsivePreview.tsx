import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface ResponsivePreviewProps {
  children: React.ReactNode;
  title?: string;
}

type DeviceType = 'desktop' | 'tablet' | 'mobile-lg' | 'mobile-md' | 'mobile-sm';

const deviceSpecs = {
  desktop: {
    name: 'Desktop',
    icon: Monitor,
    width: '100%',
    height: '600px',
    maxWidth: '1200px'
  },
  tablet: {
    name: 'Tablet',
    icon: Tablet,
    width: '768px',
    height: '600px',
    maxWidth: '768px'
  },
  'mobile-lg': {
    name: 'iPhone 14 Plus',
    icon: Smartphone,
    width: '414px',
    height: '600px',
    maxWidth: '414px'
  },
  'mobile-md': {
    name: 'iPhone 14',
    icon: Smartphone,
    width: '390px',
    height: '600px',
    maxWidth: '390px'
  },
  'mobile-sm': {
    name: 'iPhone SE',
    icon: Smartphone,
    width: '375px',
    height: '600px',
    maxWidth: '375px'
  }
};

export const ResponsivePreview: React.FC<ResponsivePreviewProps> = ({
  children,
  title = "Live Preview"
}) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceType>('mobile-md');
  const device = deviceSpecs[selectedDevice];
  const IconComponent = device.icon;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <IconComponent className="w-5 h-5" />
            {title}
          </CardTitle>
          <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
            {Object.entries(deviceSpecs).map(([key, spec]) => {
              const Icon = spec.icon;
              return (
                <Button
                  key={key}
                  variant={selectedDevice === key ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedDevice(key as DeviceType)}
                  className="h-8 px-2"
                  title={spec.name}
                >
                  <Icon className="w-4 h-4" />
                  <span className="ml-1 text-xs hidden sm:inline">
                    {key === 'desktop' ? 'Desktop' : 
                     key === 'tablet' ? 'Tablet' : 
                     key.includes('lg') ? 'L' :
                     key.includes('md') ? 'M' : 'S'}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          {device.name} • {device.width === '100%' ? 'Responsive' : device.width}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex items-center justify-center bg-muted/10 rounded-lg overflow-hidden p-4">
        <div 
          className="bg-background rounded-lg shadow-lg overflow-hidden border transition-all duration-300"
          style={{
            width: device.width,
            height: device.height,
            maxWidth: device.maxWidth,
            minHeight: '400px'
          }}
        >
          <div className="w-full h-full overflow-auto">
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};