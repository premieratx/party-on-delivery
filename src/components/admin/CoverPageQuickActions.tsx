import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Rocket, 
  Target, 
  FileText, 
  BarChart3, 
  Plus,
  Zap,
  Palette,
  Layout,
  Globe
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
  badge?: string;
}

interface CoverPageQuickActionsProps {
  onSelectAction: (actionId: string) => void;
}

export const CoverPageQuickActions: React.FC<CoverPageQuickActionsProps> = ({
  onSelectAction
}) => {
  const quickActions: QuickAction[] = [
    {
      id: 'optimized',
      title: 'Smart Creator',
      description: 'AI-powered cover page creation with optimal performance',
      icon: <Rocket className="h-6 w-6" />,
      color: 'bg-gradient-to-r from-blue-500 to-purple-600',
      onClick: () => onSelectAction('optimized'),
      badge: 'Recommended'
    },
    {
      id: 'drag-drop',
      title: 'Visual Builder',
      description: 'Drag & drop interface for complete creative control',
      icon: <Target className="h-6 w-6" />,
      color: 'bg-gradient-to-r from-green-500 to-teal-600',
      onClick: () => onSelectAction('drag-drop'),
      badge: 'New'
    },
    {
      id: 'templates',
      title: 'Template Library',
      description: 'Pre-built templates for quick page creation',
      icon: <FileText className="h-6 w-6" />,
      color: 'bg-gradient-to-r from-orange-500 to-red-600',
      onClick: () => onSelectAction('templates')
    },
    {
      id: 'performance',
      title: 'Performance Monitor',
      description: 'Track and optimize your cover page metrics',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'bg-gradient-to-r from-purple-500 to-pink-600',
      onClick: () => onSelectAction('performance'),
      badge: 'Analytics'
    }
  ];

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Lightning Fast',
      description: 'Optimized for speed and performance'
    },
    {
      icon: <Palette className="h-5 w-5" />,
      title: 'Customizable',
      description: 'Full control over design and layout'
    },
    {
      icon: <Layout className="h-5 w-5" />,
      title: 'Responsive',
      description: 'Perfect on all devices and screen sizes'
    },
    {
      icon: <Globe className="h-5 w-5" />,
      title: 'SEO Ready',
      description: 'Built-in optimization for search engines'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Rocket className="h-7 w-7 text-primary" />
            Cover Page Creator
          </CardTitle>
          <p className="text-muted-foreground">
            Create stunning, high-converting cover pages with our advanced tools
          </p>
        </CardHeader>
      </Card>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quickActions.map((action) => (
          <Card 
            key={action.id} 
            className="group cursor-pointer hover-scale transition-all duration-300 hover:shadow-lg border-2 hover:border-primary/20"
            onClick={action.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg text-white ${action.color}`}>
                  {action.icon}
                </div>
                {action.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {action.badge}
                  </Badge>
                )}
              </div>
              
              <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                {action.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {action.description}
              </p>
              
              <div className="mt-4 flex items-center text-primary text-sm font-medium">
                Get Started
                <Plus className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Why Choose Our Cover Page Creator?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="text-primary mt-1">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="font-medium text-sm">{feature.title}</h4>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};