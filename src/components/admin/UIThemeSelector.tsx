import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { 
  Palette, 
  Wand2, 
  Eye, 
  Download, 
  RotateCcw,
  Monitor,
  Smartphone,
  Tablet,
  Settings
} from 'lucide-react';
import { uiThemes, getAllCategories, applyTheme, type UITheme } from '@/utils/uiThemes';
import { toast } from 'sonner';

interface UIThemeSelectorProps {
  appId?: string;
  currentTheme?: string;
  onThemeChange?: (theme: UITheme) => void;
  position?: 'floating' | 'inline';
  isVisible?: boolean;
  onToggle?: () => void;
}

export const UIThemeSelector: React.FC<UIThemeSelectorProps> = ({
  appId,
  currentTheme,
  onThemeChange,
  position = 'floating',
  isVisible = true,
  onToggle
}) => {
  const [selectedTheme, setSelectedTheme] = useState<UITheme | null>(
    currentTheme ? uiThemes.find(t => t.id === currentTheme) || null : null
  );
  const [customColors, setCustomColors] = useState({
    primary: '',
    secondary: '',
    background: ''
  });
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getFilteredThemes = () => {
    if (selectedCategory === 'all') {
      return uiThemes;
    }
    return uiThemes.filter(theme => theme.category === selectedCategory);
  };

  const handleThemeSelect = (theme: UITheme) => {
    setSelectedTheme(theme);
    
    // Apply custom colors if they exist
    const finalTheme = {
      ...theme,
      colors: {
        ...theme.colors,
        ...(customColors.primary && { primary: customColors.primary }),
        ...(customColors.secondary && { secondary: customColors.secondary }),
        ...(customColors.background && { background: customColors.background })
      }
    };
    
    applyTheme(finalTheme);
    onThemeChange?.(finalTheme);
    toast.success(`Applied ${theme.name} theme`);
  };

  const applyCustomColors = () => {
    if (!selectedTheme) return;
    
    const customTheme = {
      ...selectedTheme,
      colors: {
        ...selectedTheme.colors,
        ...(customColors.primary && { primary: customColors.primary }),
        ...(customColors.secondary && { secondary: customColors.secondary }),
        ...(customColors.background && { background: customColors.background })
      }
    };
    
    applyTheme(customTheme);
    onThemeChange?.(customTheme);
    toast.success('Custom colors applied');
  };

  const resetToDefault = () => {
    const defaultTheme = uiThemes[0];
    setSelectedTheme(defaultTheme);
    setCustomColors({ primary: '', secondary: '', background: '' });
    applyTheme(defaultTheme);
    onThemeChange?.(defaultTheme);
    toast.success('Reset to default theme');
  };

  const getPreviewClasses = () => {
    switch (previewMode) {
      case 'mobile': return 'w-80 h-96';
      case 'tablet': return 'w-96 h-128';
      default: return 'w-full h-64';
    }
  };

  if (!isVisible) return null;

  const content = (
    <Card className={position === 'floating' ? 'shadow-xl border-2' : ''}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            UI Theme Selector
          </div>
          {position === 'floating' && onToggle && (
            <Button variant="ghost" size="sm" onClick={onToggle}>
              ✕
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Preview Mode Selection */}
        <div className="flex items-center gap-2">
          <Label className="text-sm">Preview:</Label>
          <div className="flex items-center gap-1">
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="themes" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="themes">Themes</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Theme Selection */}
          <TabsContent value="themes" className="space-y-4">
            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {getAllCategories().map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {getFilteredThemes().map((theme) => (
                <div
                  key={theme.id}
                  className={`relative cursor-pointer group rounded-lg border-2 transition-all hover:shadow-md ${
                    selectedTheme?.id === theme.id 
                      ? 'border-primary shadow-md' 
                      : 'border-border hover:border-muted-foreground'
                  }`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  {/* Theme Preview */}
                  <div className="p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: `hsl(${theme.colors.primary})` }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: `hsl(${theme.colors.secondary})` }}
                      />
                      <div 
                        className="w-4 h-4 rounded-full border"
                        style={{ backgroundColor: `hsl(${theme.colors.background})` }}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-sm">{theme.name}</div>
                      <div className="text-xs text-muted-foreground">{theme.description}</div>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline" className="text-xs">
                        {theme.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {selectedTheme?.id === theme.id && (
                    <div className="absolute top-2 right-2">
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Eye className="w-3 h-3 text-primary-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Custom Colors */}
          <TabsContent value="colors" className="space-y-4">
            {selectedTheme ? (
              <div className="space-y-4">
                <div>
                  <Label>Based on: {selectedTheme.name}</Label>
                  <Badge variant="outline" className="ml-2">{selectedTheme.category}</Badge>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label>Primary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={customColors.primary ? `hsl(${customColors.primary})` : `hsl(${selectedTheme.colors.primary})`}
                        onChange={(e) => {
                          const hex = e.target.value;
                          // Convert hex to HSL (simplified)
                          setCustomColors(prev => ({ ...prev, primary: hex }));
                        }}
                        className="w-16 h-8 p-1 border rounded"
                      />
                      <Input
                        value={customColors.primary}
                        onChange={(e) => setCustomColors(prev => ({ ...prev, primary: e.target.value }))}
                        placeholder={selectedTheme.colors.primary}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Secondary Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={customColors.secondary ? `hsl(${customColors.secondary})` : `hsl(${selectedTheme.colors.secondary})`}
                        onChange={(e) => {
                          const hex = e.target.value;
                          setCustomColors(prev => ({ ...prev, secondary: hex }));
                        }}
                        className="w-16 h-8 p-1 border rounded"
                      />
                      <Input
                        value={customColors.secondary}
                        onChange={(e) => setCustomColors(prev => ({ ...prev, secondary: e.target.value }))}
                        placeholder={selectedTheme.colors.secondary}
                        className="flex-1"
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Background Color</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="color"
                        value={customColors.background ? `hsl(${customColors.background})` : `hsl(${selectedTheme.colors.background})`}
                        onChange={(e) => {
                          const hex = e.target.value;
                          setCustomColors(prev => ({ ...prev, background: hex }));
                        }}
                        className="w-16 h-8 p-1 border rounded"
                      />
                      <Input
                        value={customColors.background}
                        onChange={(e) => setCustomColors(prev => ({ ...prev, background: e.target.value }))}
                        placeholder={selectedTheme.colors.background}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={applyCustomColors} className="w-full">
                  <Wand2 className="w-4 h-4 mr-2" />
                  Apply Custom Colors
                </Button>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                Select a theme first to customize colors
              </div>
            )}
          </TabsContent>

          {/* Theme Preview */}
          <TabsContent value="preview" className="space-y-4">
            <div className={`border rounded-lg overflow-hidden ${getPreviewClasses()}`}>
              {selectedTheme ? (
                <div 
                  className="h-full p-4 space-y-4"
                  style={{
                    backgroundColor: `hsl(${selectedTheme.colors.background})`,
                    color: `hsl(${selectedTheme.colors.foreground})`
                  }}
                >
                  {/* Header Preview */}
                  <div 
                    className="p-3 rounded"
                    style={{ backgroundColor: `hsl(${selectedTheme.colors.muted})` }}
                  >
                    <div className="font-bold" style={{ fontFamily: selectedTheme.fonts.primary }}>
                      Header Example
                    </div>
                  </div>

                  {/* Tabs Preview */}
                  <div className="flex gap-2">
                    {['Spirits', 'Beer', 'Cocktails'].map((tab, index) => (
                      <div
                        key={tab}
                        className={`px-3 py-2 rounded text-sm ${
                          index === 0 ? 'font-medium' : ''
                        }`}
                        style={{
                          backgroundColor: index === 0 
                            ? `hsl(${selectedTheme.colors.primary})` 
                            : `hsl(${selectedTheme.colors.muted})`,
                          color: index === 0 
                            ? `hsl(${selectedTheme.colors.background})` 
                            : `hsl(${selectedTheme.colors.foreground})`
                        }}
                      >
                        {tab}
                      </div>
                    ))}
                  </div>

                  {/* Card Preview */}
                  <div 
                    className="p-3 rounded border"
                    style={{ 
                      backgroundColor: `hsl(${selectedTheme.colors.background})`,
                      borderColor: `hsl(${selectedTheme.colors.border})`
                    }}
                  >
                    <div className="font-medium mb-2">Product Card</div>
                    <div className="text-sm text-muted-foreground mb-2">Sample product description</div>
                    <button
                      className="px-3 py-1 rounded text-sm font-medium"
                      style={{
                        backgroundColor: `hsl(${selectedTheme.colors.primary})`,
                        color: `hsl(${selectedTheme.colors.background})`
                      }}
                    >
                      Add to Cart
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Select a theme to see preview
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button onClick={resetToDefault} variant="outline" className="flex-1">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button 
            onClick={() => selectedTheme && handleThemeSelect(selectedTheme)} 
            className="flex-1"
            disabled={!selectedTheme}
          >
            <Download className="w-4 h-4 mr-2" />
            Apply Theme
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (position === 'floating') {
    return (
      <div className="fixed bottom-4 left-4 z-50 w-96 max-h-[80vh] overflow-y-auto">
        {content}
      </div>
    );
  }

  return content;
};