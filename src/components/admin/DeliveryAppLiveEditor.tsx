import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Upload, Monitor, Smartphone, Tablet } from 'lucide-react';

interface DeliveryAppTab {
  name: string;
  collection_handle: string;
  icon?: string;
}

interface DeliveryAppLiveEditorProps {
  appName: string;
  heroHeading: string;
  heroSubheading: string;
  logoUrl: string;
  backgroundImageUrl: string;
  tabs: DeliveryAppTab[];
  theme: 'original' | 'gold' | 'platinum';
  logoSize: number;
  headlineSize: number;
  logoVerticalPos: number;
  headlineVerticalPos: number;
  subheadlineVerticalPos: number;
  onLogoSizeChange: (value: number[]) => void;
  onHeadlineSizeChange: (value: number[]) => void;
  onLogoVerticalChange: (value: number[]) => void;
  onHeadlineVerticalChange: (value: number[]) => void;
  onSubheadlineVerticalChange: (value: number[]) => void;
  onHeroHeadingChange: (value: string) => void;
  onHeroSubheadingChange: (value: string) => void;
  onLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBackgroundUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

// Hero-Only Preview Component
const DeliveryAppHeroPreview: React.FC<{
  appName: string;
  heroHeading: string;
  heroSubheading: string;
  logoUrl?: string;
  backgroundImageUrl?: string;
  logoSize: number;
  headlineSize: number;
  subheadlineSize: number;
  logoVerticalPos: number;
  headlineVerticalPos: number;
  subheadlineVerticalPos: number;
  theme: 'original' | 'gold' | 'platinum';
  size: 'mobile' | 'tablet' | 'desktop';
}> = ({ 
  appName, 
  heroHeading, 
  heroSubheading, 
  logoUrl,
  backgroundImageUrl,
  logoSize, 
  headlineSize,
  subheadlineSize,
  logoVerticalPos,
  headlineVerticalPos,
  subheadlineVerticalPos,
  theme,
  size 
}) => {
  const getThemeBackground = () => {
    if (backgroundImageUrl) {
      return `url(${backgroundImageUrl})`;
    }
    switch (theme) {
      case 'gold':
        return 'radial-gradient(circle at center, #1a1a1a 0%, #000000 100%)';
      case 'platinum':
        return 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)';
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  };

  return (
    <div 
      className={`relative overflow-hidden transition-all duration-300 rounded-lg border shadow-lg ${
        size === 'mobile' ? 'w-full max-w-sm h-[600px]' : 
        size === 'tablet' ? 'w-full max-w-2xl h-[700px]' : 
        'w-full max-w-4xl h-[800px]'
      }`}
      style={{
        background: getThemeBackground(),
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Hero Section Only - No Tabs */}
      <div className="relative h-full flex items-center justify-center text-center text-white px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Logo */}
          {logoUrl && (
            <div 
              className="flex justify-center mb-6"
              style={{ transform: `translateY(${logoVerticalPos}px)` }}
            >
              <img 
                src={logoUrl} 
                alt={appName}
                className="max-h-24 w-auto object-contain transition-all duration-300"
                style={{ 
                  height: `${logoSize}px`,
                  maxHeight: `${logoSize}px`
                }}
              />
            </div>
          )}
          
          {/* Hero Heading */}
          <h1 
            className="font-bold text-white leading-tight"
            style={{
              fontSize: `${headlineSize}px`,
              transform: `translateY(${headlineVerticalPos}px)`
            }}
          >
            {heroHeading || "Premium Delivery Service"}
          </h1>
          
          {/* Hero Subheading */}
          <p 
            className="text-white/90 max-w-2xl mx-auto"
            style={{
              fontSize: `${subheadlineSize}px`,
              transform: `translateY(${subheadlineVerticalPos}px)`
            }}
          >
            {heroSubheading || "Satisfaction Guaranteed, On-Time Delivery"}
          </p>
        </div>
      </div>
    </div>
  );
};

// Main Live Editor Component
export const DeliveryAppLiveEditor: React.FC<DeliveryAppLiveEditorProps> = ({
  appName,
  heroHeading,
  heroSubheading,
  logoUrl,
  backgroundImageUrl,
  tabs,
  theme,
  logoSize,
  headlineSize,
  logoVerticalPos,
  headlineVerticalPos,
  subheadlineVerticalPos,
  onLogoSizeChange,
  onHeadlineSizeChange,
  onLogoVerticalChange,
  onHeadlineVerticalChange,
  onSubheadlineVerticalChange,
  onHeroHeadingChange,
  onHeroSubheadingChange,
  onLogoUpload,
  onBackgroundUpload
}) => {
  const [selectedDevice, setSelectedDevice] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const [subheadlineSize, setSubheadlineSize] = useState(18);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-full flex bg-background relative z-10">
      {/* Left Panel - Controls */}
      <div className="w-80 border-r bg-muted/20 p-6 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-6">Delivery App Editor</h3>
        
        {/* Device Selector */}
        <div className="mb-6">
          <Label className="text-sm font-medium mb-3 block">Preview Device</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={selectedDevice === 'mobile' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDevice('mobile')}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <Smartphone className="w-4 h-4" />
              <span className="text-xs">Mobile</span>
            </Button>
            <Button
              variant={selectedDevice === 'tablet' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDevice('tablet')}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <Tablet className="w-4 h-4" />
              <span className="text-xs">Tablet</span>
            </Button>
            <Button
              variant={selectedDevice === 'desktop' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDevice('desktop')}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <Monitor className="w-4 h-4" />
              <span className="text-xs">Desktop</span>
            </Button>
          </div>
        </div>

        {/* Content Editor */}
        <div className="space-y-6">
          {/* Hero Text */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Hero Content</h4>
            <div>
              <Label className="text-sm font-medium">Headline</Label>
              <Input
                value={heroHeading}
                onChange={(e) => onHeroHeadingChange(e.target.value)}
                placeholder="Enter headline..."
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Subheadline</Label>
              <Input
                value={heroSubheading}
                onChange={(e) => onHeroSubheadingChange(e.target.value)}
                placeholder="Enter subheadline..."
              />
            </div>
          </div>

          {/* Background Image */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Background Image</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => backgroundInputRef.current?.click()}
              className="w-full flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {backgroundImageUrl ? 'Change Background' : 'Upload Background'}
            </Button>
            {backgroundImageUrl && (
              <div className="text-xs text-muted-foreground">
                Background image uploaded
              </div>
            )}
          </div>

          {/* Logo Controls */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Logo</h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoInputRef.current?.click()}
              className="w-full flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              {logoUrl ? 'Change Logo' : 'Upload Logo'}
            </Button>
            
            <div>
              <Label className="text-sm font-medium">Logo Size: {logoSize}px</Label>
              <Slider
                value={[logoSize]}
                onValueChange={onLogoSizeChange}
                min={40}
                max={200}
                step={5}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Logo Position: {logoVerticalPos}px</Label>
              <Slider
                value={[logoVerticalPos]}
                onValueChange={onLogoVerticalChange}
                min={-100}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
          </div>

          {/* Text Sizing & Positioning Controls */}
          <div className="space-y-4 border-t pt-4">
            <h4 className="text-sm font-semibold text-muted-foreground">Text Sizing & Position</h4>
            
            <div>
              <Label className="text-sm font-medium">Headline Size: {headlineSize}px</Label>
              <Slider
                value={[headlineSize]}
                onValueChange={onHeadlineSizeChange}
                min={20}
                max={80}
                step={2}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Subheadline Size: {subheadlineSize}px</Label>
              <Slider
                value={[subheadlineSize]}
                onValueChange={(value) => setSubheadlineSize(value[0])}
                min={12}
                max={32}
                step={1}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Headline Position: {headlineVerticalPos}px</Label>
              <Slider
                value={[headlineVerticalPos]}
                onValueChange={onHeadlineVerticalChange}
                min={-100}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium">Subheadline Position: {subheadlineVerticalPos}px</Label>
              <Slider
                value={[subheadlineVerticalPos]}
                onValueChange={onSubheadlineVerticalChange}
                min={-100}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Live Preview with proper backdrop */}
      <div className="flex-1 p-6 bg-gradient-to-br from-muted/20 to-background relative">
        <div className="h-full flex items-center justify-center">
          <DeliveryAppHeroPreview
            appName={appName}
            heroHeading={heroHeading}
            heroSubheading={heroSubheading}
            logoUrl={logoUrl}
            backgroundImageUrl={backgroundImageUrl}
            logoSize={logoSize}
            headlineSize={headlineSize}
            subheadlineSize={subheadlineSize}
            logoVerticalPos={logoVerticalPos}
            headlineVerticalPos={headlineVerticalPos}
            subheadlineVerticalPos={subheadlineVerticalPos}
            theme={theme}
            size={selectedDevice}
          />
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={onLogoUpload}
        className="hidden"
      />
      <input
        ref={backgroundInputRef}
        type="file"
        accept="image/*"
        onChange={onBackgroundUpload}
        className="hidden"
      />
    </div>
  );
};