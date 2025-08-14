import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Monitor, 
  Smartphone, 
  Upload, 
  Save, 
  Eye, 
  RotateCcw, 
  Download,
  FileImage,
  FileVideo,
  Palette,
  Type,
  Layout,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

// Device configurations
const DEVICE_CONFIGS = {
  desktop: {
    name: 'Desktop',
    icon: Monitor,
    width: 1200,
    height: 800,
    className: 'w-full max-w-4xl mx-auto'
  },
  iphone14: {
    name: 'iPhone 14 Pro',
    icon: Smartphone,
    width: 393,
    height: 852,
    className: 'w-[393px] h-[852px] mx-auto'
  },
  galaxyS23: {
    name: 'Galaxy S23',
    icon: Smartphone,
    width: 360,
    height: 780,
    className: 'w-[360px] h-[780px] mx-auto'
  },
  pixel7: {
    name: 'Pixel 7',
    icon: Smartphone,
    width: 412,
    height: 915,
    className: 'w-[412px] h-[915px] mx-auto'
  }
};

// Template configurations
const COVER_TEMPLATES = {
  modern: {
    name: 'Modern Minimal',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    titleStyle: { fontSize: '2.5rem', fontWeight: 'bold', color: '#ffffff' },
    subtitleStyle: { fontSize: '1.2rem', color: '#e2e8f0' },
    buttonStyle: { background: '#ffffff', color: '#667eea', borderRadius: '12px' },
    layout: 'center'
  },
  vibrant: {
    name: 'Vibrant Energy',
    background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1)',
    titleStyle: { fontSize: '3rem', fontWeight: '900', color: '#ffffff' },
    subtitleStyle: { fontSize: '1.1rem', color: '#f8f9fa' },
    buttonStyle: { background: '#ffffff', color: '#ff6b6b', borderRadius: '25px' },
    layout: 'center'
  },
  elegant: {
    name: 'Elegant Dark',
    background: 'linear-gradient(180deg, #2c3e50 0%, #34495e 100%)',
    titleStyle: { fontSize: '2.8rem', fontWeight: '600', color: '#ecf0f1' },
    subtitleStyle: { fontSize: '1.3rem', color: '#bdc3c7' },
    buttonStyle: { background: '#e74c3c', color: '#ffffff', borderRadius: '8px' },
    layout: 'center'
  },
  nature: {
    name: 'Nature Fresh',
    background: 'linear-gradient(120deg, #a8edea 0%, #fed6e3 100%)',
    titleStyle: { fontSize: '2.4rem', fontWeight: 'bold', color: '#2d3748' },
    subtitleStyle: { fontSize: '1.1rem', color: '#4a5568' },
    buttonStyle: { background: '#48bb78', color: '#ffffff', borderRadius: '16px' },
    layout: 'center'
  },
  corporate: {
    name: 'Corporate Blue',
    background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
    titleStyle: { fontSize: '2.6rem', fontWeight: '700', color: '#ffffff' },
    subtitleStyle: { fontSize: '1.2rem', color: '#cbd5e0' },
    buttonStyle: { background: '#ffffff', color: '#1e3c72', borderRadius: '6px' },
    layout: 'center'
  },
  sunset: {
    name: 'Sunset Glow',
    background: 'linear-gradient(45deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    titleStyle: { fontSize: '2.7rem', fontWeight: 'bold', color: '#2d3748' },
    subtitleStyle: { fontSize: '1.15rem', color: '#4a5568' },
    buttonStyle: { background: '#ed64a6', color: '#ffffff', borderRadius: '20px' },
    layout: 'center'
  },
  ocean: {
    name: 'Ocean Waves',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    titleStyle: { fontSize: '2.9rem', fontWeight: '800', color: '#ffffff' },
    subtitleStyle: { fontSize: '1.25rem', color: '#e2e8f0' },
    buttonStyle: { background: '#4fd1c7', color: '#2d3748', borderRadius: '14px' },
    layout: 'center'
  },
  retro: {
    name: 'Retro Wave',
    background: 'linear-gradient(45deg, #833ab4 0%, #fd1d1d 50%, #fcb045 100%)',
    titleStyle: { fontSize: '2.8rem', fontWeight: '900', color: '#ffffff' },
    subtitleStyle: { fontSize: '1.1rem', color: '#f7fafc' },
    buttonStyle: { background: '#ffffff', color: '#833ab4', borderRadius: '30px' },
    layout: 'center'
  },
  minimal: {
    name: 'Clean Minimal',
    background: '#ffffff',
    titleStyle: { fontSize: '2.4rem', fontWeight: '600', color: '#2d3748' },
    subtitleStyle: { fontSize: '1.1rem', color: '#718096' },
    buttonStyle: { background: '#4299e1', color: '#ffffff', borderRadius: '8px' },
    layout: 'center'
  },
  neon: {
    name: 'Neon Cyberpunk',
    background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a1a 100%)',
    titleStyle: { fontSize: '3rem', fontWeight: 'bold', color: '#00ff41' },
    subtitleStyle: { fontSize: '1.2rem', color: '#ffffff' },
    buttonStyle: { background: '#ff0080', color: '#ffffff', borderRadius: '4px' },
    layout: 'center'
  }
};

interface CoverPageSettings {
  title: string;
  subtitle: string;
  primaryButtonText: string;
  primaryButtonUrl: string;
  secondaryButtonText: string;
  secondaryButtonUrl: string;
  backgroundType: 'color' | 'gradient' | 'image' | 'video';
  backgroundValue: string;
  backgroundFile?: File;
  titleStyle: {
    fontSize: string;
    fontWeight: string;
    color: string;
    fontFamily: string;
  };
  subtitleStyle: {
    fontSize: string;
    color: string;
    fontFamily: string;
  };
  buttonStyle: {
    background: string;
    color: string;
    borderRadius: string;
  };
  layout: 'center' | 'left' | 'right';
  opacity: number;
  showLogo: boolean;
  logoUrl: string;
  logoFile?: File;
}

const defaultSettings: CoverPageSettings = {
  title: 'Welcome to Our App',
  subtitle: 'Discover amazing features and services',
  primaryButtonText: 'Get Started',
  primaryButtonUrl: '/app',
  secondaryButtonText: 'Learn More',
  secondaryButtonUrl: '/about',
  backgroundType: 'gradient',
  backgroundValue: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  titleStyle: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter'
  },
  subtitleStyle: {
    fontSize: '1.2rem',
    color: '#e2e8f0',
    fontFamily: 'Inter'
  },
  buttonStyle: {
    background: '#ffffff',
    color: '#667eea',
    borderRadius: '12px'
  },
  layout: 'center',
  opacity: 100,
  showLogo: true,
  logoUrl: '/logo.png'
};

interface UnifiedCoverPageCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (settings: Record<string, CoverPageSettings>) => void;
}

export const UnifiedCoverPageCreator: React.FC<UnifiedCoverPageCreatorProps> = ({
  isOpen,
  onClose,
  onSave
}) => {
  const [activeDevice, setActiveDevice] = useState<keyof typeof DEVICE_CONFIGS>('desktop');
  const [deviceSettings, setDeviceSettings] = useState<Record<string, CoverPageSettings>>({
    desktop: { ...defaultSettings },
    iphone14: { ...defaultSettings },
    galaxyS23: { ...defaultSettings },
    pixel7: { ...defaultSettings }
  });
  const [previewMode, setPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const currentSettings = deviceSettings[activeDevice];

  const updateCurrentSettings = (updates: Partial<CoverPageSettings>) => {
    setDeviceSettings(prev => ({
      ...prev,
      [activeDevice]: {
        ...prev[activeDevice],
        ...updates
      }
    }));
  };

  const applyTemplate = (templateKey: keyof typeof COVER_TEMPLATES) => {
    const template = COVER_TEMPLATES[templateKey];
    updateCurrentSettings({
      backgroundType: 'gradient',
      backgroundValue: template.background,
      titleStyle: {
        ...currentSettings.titleStyle,
        ...template.titleStyle
      },
      subtitleStyle: {
        ...currentSettings.subtitleStyle,
        ...template.subtitleStyle
      },
      buttonStyle: template.buttonStyle,
      layout: template.layout as 'center' | 'left' | 'right'
    });
    toast.success(`Applied ${template.name} template`);
  };

  const handleFileUpload = (type: 'background' | 'logo') => {
    const input = type === 'background' ? fileInputRef.current : logoInputRef.current;
    if (!input) return;

    input.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'background' | 'logo') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      
      if (type === 'background') {
        updateCurrentSettings({
          backgroundType: file.type.startsWith('video/') ? 'video' : 'image',
          backgroundValue: result,
          backgroundFile: file
        });
      } else {
        updateCurrentSettings({
          logoUrl: result,
          logoFile: file
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const resetToDefaults = () => {
    updateCurrentSettings(defaultSettings);
    toast.info('Reset to default settings');
  };

  const saveAllSettings = () => {
    // Save to localStorage for persistence
    localStorage.setItem('cover-page-settings', JSON.stringify(deviceSettings));
    
    // Call external save handler if provided
    onSave?.(deviceSettings);
    
    toast.success('Cover page settings saved for all devices!');
  };

  // Load saved settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('cover-page-settings');
    if (saved) {
      try {
        const parsedSettings = JSON.parse(saved);
        setDeviceSettings(parsedSettings);
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  const renderPreview = () => {
    const device = DEVICE_CONFIGS[activeDevice];
    const settings = currentSettings;
    
    const backgroundStyle = {
      background: settings.backgroundType === 'color' ? settings.backgroundValue :
                 settings.backgroundType === 'gradient' ? settings.backgroundValue :
                 settings.backgroundType === 'image' ? `url(${settings.backgroundValue})` :
                 settings.backgroundValue,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      opacity: settings.opacity / 100
    };

    const containerClass = `relative ${device.className} h-full min-h-[400px] flex flex-col justify-center items-center text-center p-8 overflow-hidden`;
    const alignmentClass = settings.layout === 'left' ? 'items-start text-left' :
                          settings.layout === 'right' ? 'items-end text-right' :
                          'items-center text-center';

    return (
      <div className={`${containerClass} ${alignmentClass}`} style={backgroundStyle}>
        {settings.backgroundType === 'video' && (
          <video
            autoPlay
            loop
            muted
            className="absolute inset-0 w-full h-full object-cover"
            src={settings.backgroundValue}
          />
        )}
        
        <div className="relative z-10 space-y-6 max-w-2xl">
          {settings.showLogo && settings.logoUrl && (
            <img
              src={settings.logoUrl}
              alt="Logo"
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          
          <h1
            style={{
              fontSize: settings.titleStyle.fontSize,
              fontWeight: settings.titleStyle.fontWeight,
              color: settings.titleStyle.color,
              fontFamily: settings.titleStyle.fontFamily
            }}
            className="leading-tight"
          >
            {settings.title}
          </h1>
          
          <p
            style={{
              fontSize: settings.subtitleStyle.fontSize,
              color: settings.subtitleStyle.color,
              fontFamily: settings.subtitleStyle.fontFamily
            }}
            className="leading-relaxed"
          >
            {settings.subtitle}
          </p>
          
          <div className="flex gap-4 justify-center mt-8">
            <button
              style={{
                background: settings.buttonStyle.background,
                color: settings.buttonStyle.color,
                borderRadius: settings.buttonStyle.borderRadius
              }}
              className="px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {settings.primaryButtonText}
            </button>
            
            <button
              style={{
                background: 'transparent',
                color: settings.buttonStyle.background,
                borderRadius: settings.buttonStyle.borderRadius,
                border: `2px solid ${settings.buttonStyle.background}`
              }}
              className="px-8 py-3 font-semibold hover:shadow-lg transition-all duration-200"
            >
              {settings.secondaryButtonText}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Layout className="w-6 h-6" />
            Unified Cover Page Creator
          </h2>
          <Button variant="ghost" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Settings Panel */}
          <div className="w-80 border-r p-6 overflow-y-auto">
            {/* Device Selector */}
            <div className="space-y-4 mb-6">
              <Label className="text-sm font-semibold">Device View</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(DEVICE_CONFIGS).map(([key, device]) => {
                  const IconComponent = device.icon;
                  return (
                    <Button
                      key={key}
                      variant={activeDevice === key ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveDevice(key as keyof typeof DEVICE_CONFIGS)}
                      className="flex items-center gap-2"
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="hidden sm:inline">{device.name}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Templates */}
            <div className="space-y-4 mb-6">
              <Label className="text-sm font-semibold">Quick Templates</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(COVER_TEMPLATES).map(([key, template]) => (
                  <Button
                    key={key}
                    variant="outline"
                    size="sm"
                    onClick={() => applyTemplate(key as keyof typeof COVER_TEMPLATES)}
                    className="text-xs"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            {/* Settings Tabs */}
            <Tabs defaultValue="content" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="design">Design</TabsTrigger>
                <TabsTrigger value="background">Background</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={currentSettings.title}
                    onChange={(e) => updateCurrentSettings({ title: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label>Subtitle</Label>
                  <Textarea
                    value={currentSettings.subtitle}
                    onChange={(e) => updateCurrentSettings({ subtitle: e.target.value })}
                    rows={2}
                  />
                </div>
                
                <div>
                  <Label>Primary Button Text</Label>
                  <Input
                    value={currentSettings.primaryButtonText}
                    onChange={(e) => updateCurrentSettings({ primaryButtonText: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label>Secondary Button Text</Label>
                  <Input
                    value={currentSettings.secondaryButtonText}
                    onChange={(e) => updateCurrentSettings({ secondaryButtonText: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={currentSettings.showLogo}
                    onCheckedChange={(checked) => updateCurrentSettings({ showLogo: checked })}
                  />
                  <Label>Show Logo</Label>
                </div>

                {currentSettings.showLogo && (
                  <div>
                    <Label>Logo</Label>
                    <div className="flex gap-2">
                      <Input
                        value={currentSettings.logoUrl}
                        onChange={(e) => updateCurrentSettings({ logoUrl: e.target.value })}
                        placeholder="Logo URL"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload('logo')}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="design" className="space-y-4">
                <div>
                  <Label>Layout</Label>
                  <Select
                    value={currentSettings.layout}
                    onValueChange={(value) => 
                      updateCurrentSettings({ layout: value as 'center' | 'left' | 'right' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Title Color</Label>
                  <Input
                    type="color"
                    value={currentSettings.titleStyle.color}
                    onChange={(e) => updateCurrentSettings({
                      titleStyle: { ...currentSettings.titleStyle, color: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <Label>Subtitle Color</Label>
                  <Input
                    type="color"
                    value={currentSettings.subtitleStyle.color}
                    onChange={(e) => updateCurrentSettings({
                      subtitleStyle: { ...currentSettings.subtitleStyle, color: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <Label>Button Background</Label>
                  <Input
                    type="color"
                    value={currentSettings.buttonStyle.background}
                    onChange={(e) => updateCurrentSettings({
                      buttonStyle: { ...currentSettings.buttonStyle, background: e.target.value }
                    })}
                  />
                </div>

                <div>
                  <Label>Button Text Color</Label>
                  <Input
                    type="color"
                    value={currentSettings.buttonStyle.color}
                    onChange={(e) => updateCurrentSettings({
                      buttonStyle: { ...currentSettings.buttonStyle, color: e.target.value }
                    })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="background" className="space-y-4">
                <div>
                  <Label>Background Type</Label>
                  <Select
                    value={currentSettings.backgroundType}
                    onValueChange={(value) => 
                      updateCurrentSettings({ backgroundType: value as 'color' | 'gradient' | 'image' | 'video' })
                    }
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
                </div>

                <div>
                  <Label>Background Value</Label>
                  <div className="flex gap-2">
                    <Input
                      value={currentSettings.backgroundValue}
                      onChange={(e) => updateCurrentSettings({ backgroundValue: e.target.value })}
                      placeholder={currentSettings.backgroundType === 'color' ? '#000000' : 
                                  currentSettings.backgroundType === 'gradient' ? 'linear-gradient(...)' :
                                  'URL or upload file'}
                    />
                    {(currentSettings.backgroundType === 'image' || currentSettings.backgroundType === 'video') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileUpload('background')}
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Opacity: {currentSettings.opacity}%</Label>
                  <Slider
                    value={[currentSettings.opacity]}
                    onValueChange={([value]) => updateCurrentSettings({ opacity: value })}
                    max={100}
                    min={0}
                    step={5}
                    className="mt-2"
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Action Buttons */}
            <div className="space-y-2 mt-6">
              <Button
                onClick={() => setPreviewMode(!previewMode)}
                variant="outline"
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit Mode' : 'Preview Mode'}
              </Button>
              
              <Button
                onClick={resetToDefaults}
                variant="outline"
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset Device
              </Button>
              
              <Button
                onClick={saveAllSettings}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save All Devices
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 p-6 bg-muted/20 overflow-auto">
            <div className="h-full flex items-center justify-center">
              <div className="border rounded-lg bg-background shadow-lg overflow-hidden">
                {renderPreview()}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={(e) => handleFileChange(e, 'background')}
          style={{ display: 'none' }}
        />
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e, 'logo')}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};