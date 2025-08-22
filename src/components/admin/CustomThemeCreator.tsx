import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Palette, 
  X, 
  Settings, 
  Info, 
  Eye, 
  Type, 
  Layout,
  PaintBucket,
  Brush,
  CircleDot,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

interface CustomThemeCreatorProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ThemeColors {
  primary: string;
  secondary: string;
  tertiary: string;
  background: string;
  foreground: string;
  muted: string;
  accent: string;
  destructive: string;
  border: string;
  ring: string;
}

interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  editable?: boolean;
}

const defaultPresets: ThemePreset[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Clean and professional default theme',
    colors: {
      primary: '222 84% 5%',
      secondary: '210 40% 98%', 
      tertiary: '220 14% 96%',
      background: '0 0% 100%',
      foreground: '222 84% 5%',
      muted: '210 40% 98%',
      accent: '210 40% 98%',
      destructive: '0 84% 60%',
      border: '214 32% 91%',
      ring: '222 84% 5%'
    }
  },

  {
    id: 'dark',
    name: 'Dark Mode',
    description: 'Elegant dark theme with high contrast',
    colors: {
      primary: '210 40% 98%',
      secondary: '217 33% 17%',
      tertiary: '220 14% 96%',
      background: '222 84% 5%',
      foreground: '210 40% 98%',
      muted: '217 33% 17%',
      accent: '217 33% 17%',
      destructive: '0 63% 31%',
      border: '217 33% 17%',
      ring: '212 95% 68%'
    }
  },
  {
    id: 'blue',
    name: 'Ocean Blue',
    description: 'Calming blue theme for modern interfaces',
    colors: {
      primary: '221 83% 53%',
      secondary: '210 40% 98%',
      tertiary: '220 14% 96%', 
      background: '0 0% 100%',
      foreground: '222 84% 5%',
      muted: '210 40% 98%',
      accent: '210 40% 98%',
      destructive: '0 84% 60%',
      border: '214 32% 91%',
      ring: '221 83% 53%'
    }
  }
];

export const CustomThemeCreator: React.FC<CustomThemeCreatorProps> = ({
  isOpen,
  onClose
}) => {
  const [selectedPreset, setSelectedPreset] = useState<ThemePreset | null>(defaultPresets[0]);
  const [customPresets, setCustomPresets] = useState<ThemePreset[]>([]);
  const [isEditingPreset, setIsEditingPreset] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [colors, setColors] = useState<ThemeColors>(
    selectedPreset?.colors || defaultPresets[0].colors
  );

  if (!isOpen) return null;

  const colorDefinitions = [
    {
      key: 'primary' as keyof ThemeColors,
      name: 'Primary',
      description: 'Main brand color - buttons, links, active states',
      usage: 'CTA buttons, nav active, primary text links',
      examples: ['Submit buttons', 'Primary navigation', 'Call-to-action elements']
    },
    {
      key: 'secondary' as keyof ThemeColors,
      name: 'Secondary',
      description: 'Supporting brand color - secondary buttons, subtle highlights',
      usage: 'Secondary buttons, badges, subtle accents',
      examples: ['Cancel buttons', 'Status badges', 'Secondary actions']
    },
    {
      key: 'tertiary' as keyof ThemeColors,
      name: 'Tertiary',
      description: 'Accent color for special elements and highlights',
      usage: 'Special promotions, highlights, decorative elements',
      examples: ['Promotional banners', 'Special offers', 'Highlighted content']
    },
    {
      key: 'background' as keyof ThemeColors,
      name: 'Background',
      description: 'Main page background color',
      usage: 'Page backgrounds, main content areas',
      examples: ['Page body', 'Content containers', 'Main layout']
    },
    {
      key: 'foreground' as keyof ThemeColors,
      name: 'Foreground',
      description: 'Primary text color - headings, body text',
      usage: 'H1, H2, H3 headings, paragraph text, labels',
      examples: ['Page titles', 'Product names', 'Body paragraphs']
    },
    {
      key: 'muted' as keyof ThemeColors,
      name: 'Muted',
      description: 'Subtle background for cards and sections',
      usage: 'Card backgrounds, section dividers, subtle areas',
      examples: ['Product cards', 'Form sections', 'Sidebar backgrounds']
    },
    {
      key: 'accent' as keyof ThemeColors,
      name: 'Accent',
      description: 'Attention-grabbing color for important elements',
      usage: 'Notifications, warnings, important highlights',
      examples: ['Success messages', 'Important notices', 'Featured items']
    },
    {
      key: 'destructive' as keyof ThemeColors,
      name: 'Destructive',
      description: 'Error and danger states',
      usage: 'Error messages, delete buttons, danger alerts',
      examples: ['Error notifications', 'Delete confirmations', 'Form validation errors']
    },
    {
      key: 'border' as keyof ThemeColors,
      name: 'Border',
      description: 'Lines, dividers, and input borders',
      usage: 'Input borders, card outlines, separators',
      examples: ['Form inputs', 'Card borders', 'Section dividers']
    },
    {
      key: 'ring' as keyof ThemeColors,
      name: 'Ring',
      description: 'Focus ring color for accessibility',
      usage: 'Focus states, keyboard navigation highlights',
      examples: ['Button focus', 'Input focus', 'Link focus']
    }
  ];

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const newColors = {
      ...colors,
      [key]: value
    };
    setColors(newColors);
    
    // Apply immediately for preview
    if (previewMode) {
      const root = document.documentElement;
      root.style.setProperty(`--${key}`, String(value));
    }
  };

  const applyTheme = () => {
    if (!previewMode) {
      setPreviewMode(true);
    }

    const root = document.documentElement;
    
    // Convert hex to HSL for CSS custom properties
    const hexToHsl = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;

      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
      }

      return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    };

    // Apply colors to CSS custom properties (colors are already in HSL format)
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, String(value));
    });

    toast.success('Theme applied! Check the preview.');
  };

  const resetTheme = () => {
    const root = document.documentElement;
    
    // Reset to default values
    Object.keys(colors).forEach(key => {
      root.style.removeProperty(`--${key}`);
    });

    setPreviewMode(false);
    toast.info('Theme reset to default');
  };

  const saveTheme = () => {
    // Save theme to localStorage with additional metadata
    const themeData = {
      colors,
      savedAt: new Date().toISOString(),
      name: `Custom Theme ${new Date().toLocaleDateString()}`
    };
    localStorage.setItem('custom-theme', JSON.stringify(themeData));
    
    // Also apply the theme immediately
    applyTheme();
    toast.success('Custom theme saved and applied!');
  };

  const loadSavedTheme = () => {
    const saved = localStorage.getItem('custom-theme');
    if (saved) {
      try {
        const themeData = JSON.parse(saved);
        const savedColors = themeData.colors || themeData; // Support both old and new format
        setColors(savedColors);
        
        // Apply the loaded theme immediately
        const root = document.documentElement;
        Object.entries(savedColors).forEach(([key, value]) => {
          root.style.setProperty(`--${key}`, String(value));
        });
        
        setPreviewMode(true);
        toast.success('Saved theme loaded and applied!');
      } catch (error) {
        toast.error('Error loading saved theme');
      }
    } else {
      toast.error('No saved theme found');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Custom Theme Creator
          </DialogTitle>
          <DialogDescription id="dialog-description" className="sr-only">
            Create and customize visual themes for your applications.
          </DialogDescription>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <PaintBucket className="w-4 h-4" />
              Colors
            </TabsTrigger>
            <TabsTrigger value="legend" className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Legend
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {colorDefinitions.slice(0, 3).map((colorDef) => (
                <Card key={colorDef.key} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-border"
                        style={{ backgroundColor: colors[colorDef.key] }}
                      />
                      <Label className="font-semibold">{colorDef.name}</Label>
                    </div>
                    <Input
                      type="color"
                      value={colors[colorDef.key]}
                      onChange={(e) => handleColorChange(colorDef.key, e.target.value)}
                      className="h-10 w-full"
                    />
                    <Input
                      type="text"
                      value={colors[colorDef.key]}
                      onChange={(e) => handleColorChange(colorDef.key, e.target.value)}
                      placeholder="#000000"
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {colorDef.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {colorDefinitions.slice(3).map((colorDef) => (
                <Card key={colorDef.key} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full border-2 border-border"
                        style={{ backgroundColor: colors[colorDef.key] }}
                      />
                      <Label className="font-semibold">{colorDef.name}</Label>
                    </div>
                    <Input
                      type="color"
                      value={colors[colorDef.key]}
                      onChange={(e) => handleColorChange(colorDef.key, e.target.value)}
                      className="h-10 w-full"
                    />
                    <Input
                      type="text"
                      value={colors[colorDef.key]}
                      onChange={(e) => handleColorChange(colorDef.key, e.target.value)}
                      placeholder="#000000"
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      {colorDef.description}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={applyTheme} className="flex items-center gap-2">
                <Brush className="w-4 h-4" />
                {previewMode ? 'Update Preview' : 'Apply & Preview'}
              </Button>
              <Button variant="outline" onClick={resetTheme}>
                Reset to Default
              </Button>
              <Button variant="secondary" onClick={saveTheme}>
                Save Theme
              </Button>
              <Button variant="secondary" onClick={loadSavedTheme}>
                Load Saved
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="legend" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Info className="w-5 h-5" />
                Color Usage Guide
              </h3>
              
              {colorDefinitions.map((colorDef) => (
                <Card key={colorDef.key} className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-lg border-2 border-border shadow-sm"
                        style={{ backgroundColor: colors[colorDef.key] }}
                      />
                      <div>
                        <h4 className="font-semibold text-base">{colorDef.name}</h4>
                        <p className="text-sm text-muted-foreground">{colorDef.description}</p>
                      </div>
                    </div>
                    
                    <div>
                      <Badge variant="outline" className="mb-2">Usage</Badge>
                      <p className="text-sm">{colorDef.usage}</p>
                    </div>
                    
                    <div>
                      <Badge variant="outline" className="mb-2">Examples</Badge>
                      <ul className="text-sm space-y-1">
                        {colorDef.examples.map((example, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CircleDot className="w-3 h-3" />
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Theme Preview</h3>
              
              {previewMode ? (
                <div className="space-y-4 p-4 border rounded-lg bg-background">
                  <div className="space-y-2">
                    <h1 className="text-2xl font-bold text-foreground">Sample Heading (H1)</h1>
                    <h2 className="text-xl font-semibold text-foreground">Subheading (H2)</h2>
                    <p className="text-muted-foreground">Sample paragraph text with muted foreground color.</p>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button style={{ backgroundColor: colors.primary, color: 'white' }}>
                      Primary Button
                    </Button>
                    <Button variant="secondary" style={{ backgroundColor: colors.secondary, color: 'white' }}>
                      Secondary Button
                    </Button>
                    <Button variant="outline" style={{ borderColor: colors.border }}>
                      Outline Button
                    </Button>
                  </div>
                  
                  <Card className="p-4" style={{ backgroundColor: colors.muted }}>
                    <CardHeader>
                      <CardTitle>Sample Card</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>This card uses the muted background color.</p>
                    </CardContent>
                  </Card>
                  
                  <div className="space-y-2">
                    <Badge style={{ backgroundColor: colors.accent, color: 'white' }}>
                      Accent Badge
                    </Badge>
                    <Badge variant="destructive" style={{ backgroundColor: colors.destructive, color: 'white' }}>
                      Destructive Badge
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 border rounded-lg bg-muted">
                  <Eye className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Click "Apply & Preview" to see your custom theme in action</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};