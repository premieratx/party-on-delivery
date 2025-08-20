import React, { useState, useCallback, useMemo, useRef, useReducer } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Save, 
  Eye, 
  Undo, 
  Redo, 
  Copy, 
  Palette, 
  Type, 
  Image, 
  Video,
  Layout,
  Sparkles,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Types
interface CoverPageState {
  title: string;
  subtitle: string;
  slug: string;
  backgroundType: 'color' | 'gradient' | 'image' | 'video';
  backgroundValue: string;
  logoUrl: string;
  logoHeight: number;
  buttons: ButtonConfig[];
  titleStyle: TextStyle;
  subtitleStyle: TextStyle;
  layout: 'left' | 'center' | 'right';
  opacity: number;
  animations: AnimationConfig;
  isActive: boolean;
  isDefaultHomepage: boolean;
}

interface ButtonConfig {
  id: string;
  text: string;
  url: string;
  variant: 'primary' | 'secondary' | 'outline';
  style: ButtonStyle;
}

interface TextStyle {
  fontSize: number;
  fontWeight: string;
  color: string;
  fontFamily: string;
}

interface ButtonStyle {
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  padding: string;
}

interface AnimationConfig {
  enabled: boolean;
  duration: number;
  delay: number;
  easing: string;
}

// Action types for reducer
type CoverPageAction = 
  | { type: 'SET_FIELD'; field: keyof CoverPageState; value: any }
  | { type: 'SET_BUTTON'; index: number; button: ButtonConfig }
  | { type: 'ADD_BUTTON' }
  | { type: 'REMOVE_BUTTON'; index: number }
  | { type: 'APPLY_TEMPLATE'; template: CoverPageTemplate }
  | { type: 'RESET_TO_DEFAULT' }
  | { type: 'LOAD_STATE'; state: CoverPageState };

// Templates
interface CoverPageTemplate {
  id: string;
  name: string;
  preview: string;
  config: Partial<CoverPageState>;
}

const TEMPLATES: CoverPageTemplate[] = [
  {
    id: 'modern',
    name: 'Modern Minimal',
    preview: '/api/placeholder/300/200',
    config: {
      backgroundType: 'gradient',
      backgroundValue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      titleStyle: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#ffffff',
        fontFamily: 'Inter'
      },
      subtitleStyle: {
        fontSize: 18,
        fontWeight: 'normal',
        color: '#e2e8f0',
        fontFamily: 'Inter'
      },
      layout: 'center'
    }
  },
  {
    id: 'vibrant',
    name: 'Vibrant Energy',
    preview: '/api/placeholder/300/200',
    config: {
      backgroundType: 'gradient',
      backgroundValue: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)',
      titleStyle: {
        fontSize: 56,
        fontWeight: '900',
        color: '#ffffff',
        fontFamily: 'Inter'
      },
      subtitleStyle: {
        fontSize: 16,
        fontWeight: 'normal',
        color: '#f8f9fa',
        fontFamily: 'Inter'
      },
      layout: 'center'
    }
  },
  {
    id: 'elegant',
    name: 'Elegant Dark',
    preview: '/api/placeholder/300/200',
    config: {
      backgroundType: 'gradient',
      backgroundValue: 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)',
      titleStyle: {
        fontSize: 44,
        fontWeight: '600',
        color: '#ecf0f1',
        fontFamily: 'Inter'
      },
      subtitleStyle: {
        fontSize: 20,
        fontWeight: 'normal',
        color: '#bdc3c7',
        fontFamily: 'Inter'
      },
      layout: 'center'
    }
  }
];

// Default state
const defaultState: CoverPageState = {
  title: 'Welcome to Our App',
  subtitle: 'Discover amazing features and premium services',
  slug: '',
  backgroundType: 'gradient',
  backgroundValue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  logoUrl: '',
  logoHeight: 60,
  buttons: [
    {
      id: '1',
      text: 'Get Started',
      url: '/app',
      variant: 'primary',
      style: {
        backgroundColor: '#ffffff',
        textColor: '#667eea',
        borderRadius: 12,
        padding: '12px 24px'
      }
    },
    {
      id: '2',
      text: 'Learn More',
      url: '/about',
      variant: 'secondary',
      style: {
        backgroundColor: 'transparent',
        textColor: '#ffffff',
        borderRadius: 12,
        padding: '12px 24px'
      }
    }
  ],
  titleStyle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter'
  },
  subtitleStyle: {
    fontSize: 18,
    fontWeight: 'normal',
    color: '#e2e8f0',
    fontFamily: 'Inter'
  },
  layout: 'center',
  opacity: 100,
  animations: {
    enabled: true,
    duration: 800,
    delay: 200,
    easing: 'ease-out'
  },
  isActive: true,
  isDefaultHomepage: false
};

// Reducer
const coverPageReducer = (state: CoverPageState, action: CoverPageAction): CoverPageState => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'SET_BUTTON':
      const newButtons = [...state.buttons];
      newButtons[action.index] = action.button;
      return { ...state, buttons: newButtons };
    case 'ADD_BUTTON':
      return {
        ...state,
        buttons: [
          ...state.buttons,
          {
            id: Date.now().toString(),
            text: 'New Button',
            url: '#',
            variant: 'primary',
            style: {
              backgroundColor: '#ffffff',
              textColor: '#667eea',
              borderRadius: 12,
              padding: '12px 24px'
            }
          }
        ]
      };
    case 'REMOVE_BUTTON':
      return {
        ...state,
        buttons: state.buttons.filter((_, index) => index !== action.index)
      };
    case 'APPLY_TEMPLATE':
      return { ...state, ...action.template.config };
    case 'RESET_TO_DEFAULT':
      return { ...defaultState };
    case 'LOAD_STATE':
      return action.state;
    default:
      return state;
  }
};

// Optimized Preview Component
const CoverPagePreview = React.memo(({ 
  state, 
  deviceType = 'desktop' 
}: { 
  state: CoverPageState; 
  deviceType?: 'desktop' | 'tablet' | 'mobile' 
}) => {
  const containerClasses = useMemo(() => {
    const base = 'relative overflow-hidden rounded-lg shadow-lg transition-all duration-300';
    const deviceClasses = {
      desktop: 'w-full max-w-4xl h-96',
      tablet: 'w-80 h-96 mx-auto',
      mobile: 'w-64 h-96 mx-auto'
    };
    return `${base} ${deviceClasses[deviceType]}`;
  }, [deviceType]);

  const backgroundStyle = useMemo(() => ({
    background: state.backgroundType === 'gradient' ? state.backgroundValue :
                state.backgroundType === 'color' ? state.backgroundValue :
                `url(${state.backgroundValue})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    opacity: state.opacity / 100
  }), [state.backgroundType, state.backgroundValue, state.opacity]);

  const layoutClasses = useMemo(() => {
    const alignmentMap = {
      left: 'items-start text-left',
      center: 'items-center text-center',
      right: 'items-end text-right'
    };
    return alignmentMap[state.layout];
  }, [state.layout]);

  return (
    <div className={containerClasses} style={backgroundStyle}>
      {state.backgroundType === 'video' && (
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover"
          src={state.backgroundValue}
        />
      )}
      
      <div className={`relative z-10 flex flex-col justify-center h-full p-8 ${layoutClasses}`}>
        {state.logoUrl && (
          <img
            src={state.logoUrl}
            alt="Logo"
            className="mb-4"
            style={{ height: state.logoHeight }}
          />
        )}
        
        <h1
          style={{
            fontSize: `${state.titleStyle.fontSize}px`,
            fontWeight: state.titleStyle.fontWeight,
            color: state.titleStyle.color,
            fontFamily: state.titleStyle.fontFamily
          }}
          className="leading-tight mb-4"
        >
          {state.title}
        </h1>
        
        <p
          style={{
            fontSize: `${state.subtitleStyle.fontSize}px`,
            color: state.subtitleStyle.color,
            fontFamily: state.subtitleStyle.fontFamily
          }}
          className="leading-relaxed mb-8 max-w-2xl"
        >
          {state.subtitle}
        </p>
        
        <div className="flex flex-wrap gap-4">
          {state.buttons.map((button, index) => (
            <button
              key={button.id}
              className="px-6 py-3 font-medium transition-all duration-200 hover:scale-105"
              style={{
                backgroundColor: button.style.backgroundColor,
                color: button.style.textColor,
                borderRadius: `${button.style.borderRadius}px`,
                border: button.variant === 'outline' ? `2px solid ${button.style.textColor}` : 'none'
              }}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

// Template Selector Component
const TemplateSelector = React.memo(({ onApply }: { onApply: (template: CoverPageTemplate) => void }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {TEMPLATES.map((template) => (
      <Card 
        key={template.id} 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onApply(template)}
      >
        <CardContent className="p-4">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded mb-3 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-sm">{template.name}</h3>
        </CardContent>
      </Card>
    ))}
  </div>
));

// Main Component
export const OptimizedCoverPageCreator: React.FC = () => {
  const [state, dispatch] = useReducer(coverPageReducer, defaultState);
  const [currentDevice, setCurrentDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Optimization: Memoized handlers
  const handleFieldChange = useCallback((field: keyof CoverPageState, value: any) => {
    dispatch({ type: 'SET_FIELD', field, value });
  }, []);

  const handleButtonChange = useCallback((index: number, updates: Partial<ButtonConfig>) => {
    const updatedButton = { ...state.buttons[index], ...updates };
    dispatch({ type: 'SET_BUTTON', index, button: updatedButton });
  }, [state.buttons]);

  const handleApplyTemplate = useCallback((template: CoverPageTemplate) => {
    dispatch({ type: 'APPLY_TEMPLATE', template });
    toast.success(`Applied ${template.name} template`);
  }, []);

  const handleSave = useCallback(async () => {
    if (!state.title || !state.slug) {
      toast.error('Title and slug are required');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('cover_pages')
        .upsert({
          slug: state.slug,
          title: state.title,
          subtitle: state.subtitle,
          bg_image_url: state.backgroundType === 'image' ? state.backgroundValue : null,
          bg_video_url: state.backgroundType === 'video' ? state.backgroundValue : null,
          logo_url: state.logoUrl,
          logo_height: state.logoHeight,
          buttons: JSON.stringify(state.buttons),
          styles: JSON.stringify({
            titleStyle: state.titleStyle,
            subtitleStyle: state.subtitleStyle,
            background: state.backgroundValue,
            layout: state.layout,
            animations: state.animations
          }),
          is_active: state.isActive,
          is_default_homepage: state.isDefaultHomepage
        });

      if (error) throw error;
      toast.success('Cover page saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save cover page');
    } finally {
      setIsSaving(false);
    }
  }, [state]);

  // Optimization: Memoized preview
  const memoizedPreview = useMemo(() => (
    <CoverPagePreview state={state} deviceType={currentDevice} />
  ), [state, currentDevice]);

  if (previewMode) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
        <div className="relative w-full h-full flex items-center justify-center p-8">
          <Button
            onClick={() => setPreviewMode(false)}
            className="absolute top-4 right-4 z-10"
            variant="secondary"
          >
            Exit Preview
          </Button>
          <CoverPagePreview state={state} deviceType="desktop" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Cover Page Creator</h1>
          <Badge variant="secondary">Optimized</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Device Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            {[
              { key: 'desktop', icon: Monitor },
              { key: 'tablet', icon: Tablet },
              { key: 'mobile', icon: Smartphone }
            ].map(({ key, icon: Icon }) => (
              <Button
                key={key}
                size="sm"
                variant={currentDevice === key ? 'default' : 'ghost'}
                onClick={() => setCurrentDevice(key as any)}
              >
                <Icon className="w-4 h-4" />
              </Button>
            ))}
          </div>
          
          <Button onClick={() => setPreviewMode(true)} variant="outline">
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
          
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="w-80 border-r bg-background">
          <ScrollArea className="h-full p-6">
            <Tabs defaultValue="content" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={state.title}
                      onChange={(e) => handleFieldChange('title', e.target.value)}
                      placeholder="Enter page title"
                    />
                  </div>
                  
                  <div>
                    <Label>Subtitle</Label>
                    <Textarea
                      value={state.subtitle}
                      onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                      placeholder="Enter page subtitle"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label>Slug</Label>
                    <Input
                      value={state.slug}
                      onChange={(e) => handleFieldChange('slug', e.target.value)}
                      placeholder="page-slug"
                    />
                  </div>
                </div>

                {/* Buttons Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Call-to-Action Buttons</Label>
                    <Button 
                      size="sm" 
                      onClick={() => dispatch({ type: 'ADD_BUTTON' })}
                    >
                      Add Button
                    </Button>
                  </div>
                  
                  {state.buttons.map((button, index) => (
                    <Card key={button.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Button {index + 1}</Label>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => dispatch({ type: 'REMOVE_BUTTON', index })}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      <Input
                        value={button.text}
                        onChange={(e) => handleButtonChange(index, { text: e.target.value })}
                        placeholder="Button text"
                      />
                      
                      <Input
                        value={button.url}
                        onChange={(e) => handleButtonChange(index, { url: e.target.value })}
                        placeholder="Button URL"
                      />
                      
                      <Select
                        value={button.variant}
                        onValueChange={(value: any) => handleButtonChange(index, { variant: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="outline">Outline</SelectItem>
                        </SelectContent>
                      </Select>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="design" className="space-y-6">
                {/* Background */}
                <div className="space-y-4">
                  <Label>Background</Label>
                  <Select
                    value={state.backgroundType}
                    onValueChange={(value: any) => handleFieldChange('backgroundType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="color">Solid Color</SelectItem>
                      <SelectItem value="gradient">Gradient</SelectItem>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    value={state.backgroundValue}
                    onChange={(e) => handleFieldChange('backgroundValue', e.target.value)}
                    placeholder={`Enter ${state.backgroundType}...`}
                  />
                </div>

                {/* Typography */}
                <div className="space-y-4">
                  <Label>Title Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Size</Label>
                      <Slider
                        value={[state.titleStyle.fontSize]}
                        onValueChange={([value]) => 
                          handleFieldChange('titleStyle', { ...state.titleStyle, fontSize: value })
                        }
                        min={16}
                        max={80}
                        step={2}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Color</Label>
                      <Input
                        type="color"
                        value={state.titleStyle.color}
                        onChange={(e) =>
                          handleFieldChange('titleStyle', { ...state.titleStyle, color: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* Layout */}
                <div className="space-y-4">
                  <Label>Layout</Label>
                  <Select
                    value={state.layout}
                    onValueChange={(value: any) => handleFieldChange('layout', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left Aligned</SelectItem>
                      <SelectItem value="center">Centered</SelectItem>
                      <SelectItem value="right">Right Aligned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Animations */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Animations</Label>
                    <Switch
                      checked={state.animations.enabled}
                      onCheckedChange={(checked) =>
                        handleFieldChange('animations', { ...state.animations, enabled: checked })
                      }
                    />
                  </div>
                  
                  {state.animations.enabled && (
                    <div>
                      <Label className="text-xs">Duration (ms)</Label>
                      <Slider
                        value={[state.animations.duration]}
                        onValueChange={([value]) =>
                          handleFieldChange('animations', { ...state.animations, duration: value })
                        }
                        min={200}
                        max={2000}
                        step={100}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="templates">
                <TemplateSelector onApply={handleApplyTemplate} />
              </TabsContent>
            </Tabs>
          </ScrollArea>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 bg-muted/20 p-6 flex items-center justify-center">
          {memoizedPreview}
        </div>
      </div>
    </div>
  );
};