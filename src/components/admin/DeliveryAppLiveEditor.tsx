import React, { useRef } from 'react';
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
  // App content
  appName: string;
  heroHeading: string;
  heroSubheading: string;
  logoUrl: string;
  backgroundImageUrl: string;
  tabs: DeliveryAppTab[];
  theme: 'original' | 'gold' | 'platinum';
  
  // Positioning controls
  logoSize: number;
  headlineSize: number;
  logoVerticalPos: number;
  headlineVerticalPos: number;
  subheadlineVerticalPos: number;
  
  // Update handlers
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

// Real-time Preview Component - Exact Replica of DirectDeliveryApp
const DeliveryAppLivePreview: React.FC<{
  appName: string;
  heroHeading: string;
  heroSubheading: string;
  logoUrl?: string;
  logoSize: number;
  headlineSize: number;
  logoVerticalPos: number;
  headlineVerticalPos: number;
  subheadlineVerticalPos: number;
  backgroundImageUrl?: string;
  tabs: DeliveryAppTab[];
  device: 'mobile' | 'tablet' | 'desktop';
}> = ({ 
  appName, 
  heroHeading, 
  heroSubheading, 
  logoUrl, 
  logoSize,
  headlineSize,
  logoVerticalPos,
  headlineVerticalPos,
  subheadlineVerticalPos,
  backgroundImageUrl,
  tabs, 
  device 
}) => {
  const deviceClasses = {
    mobile: 'w-[375px] h-[667px]',
    tablet: 'w-[768px] h-[800px]',
    desktop: 'w-[1200px] h-[800px]'
  };
  
  return (
    <div className={`${deviceClasses[device]} border rounded-xl overflow-hidden shadow-xl`}>
      <div className="h-full flex flex-col bg-background">
        {/* EXACT REPLICA: Hero Section like DirectDeliveryApp */}
        <div 
          className="relative bg-gradient-to-r from-primary to-secondary text-white py-12"
          style={{
            backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {backgroundImageUrl && <div className="absolute inset-0 bg-black/50" />}
          <div className="relative container mx-auto px-4 text-center">
            {logoUrl && (
              <img 
                src={logoUrl} 
                alt={appName} 
                className="mx-auto mb-6 object-contain" 
                style={{ 
                  height: `${logoSize}px`,
                  transform: `translateY(${logoVerticalPos}px)`
                }}
              />
            )}
            <h1 
              className="font-bold mb-4 text-white"
              style={{ 
                fontSize: `${headlineSize}px`,
                transform: `translateY(${headlineVerticalPos}px)`
              }}
            >
              {heroHeading || appName}
            </h1>
            <p 
              className="text-blue-100 mb-6"
              style={{ 
                fontSize: `${Math.max(14, headlineSize * 0.6)}px`,
                transform: `translateY(${subheadlineVerticalPos}px)`
              }}
            >
              {heroSubheading || "Satisfaction Guaranteed, On-Time Delivery"}
            </p>
            
            {/* Cart Button */}
            <Button className="bg-white text-primary hover:bg-white/90" size="lg">
              Cart (0)
            </Button>
          </div>
        </div>

        {/* EXACT REPLICA: Tab Navigation */}
        <div className="container mx-auto px-4 py-8 flex-1">
          {tabs.length > 0 && (
            <div className="mb-8 border-b pb-4">
              <div className="flex overflow-x-auto gap-2 scrollbar-hide">
                {tabs.map((tab: any, index: number) => (
                  <Button
                    key={tab.collection_handle || index}
                    variant={index === 0 ? "default" : "outline"}
                    className="flex-shrink-0 text-sm px-4 py-2 whitespace-nowrap"
                  >
                    {tab.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* EXACT REPLICA: Product Grid Placeholder */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="bg-card rounded-lg border p-4 hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                <h3 className="font-semibold mb-2 text-sm">Sample Product {i}</h3>
                <p className="text-lg font-bold text-primary mb-4">$12.99</p>
                <Button className="w-full text-sm">Add to Cart</Button>
              </div>
            ))}
          </div>
        </div>

        {/* EXACT REPLICA: Fixed Action Buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <Button variant="outline" size="sm" className="bg-background/90 backdrop-blur-sm">
            Admin
          </Button>
        </div>
      </div>
    </div>
  );
};

export const DeliveryAppLiveEditor: React.FC<DeliveryAppLiveEditorProps> = (props) => {
  const [previewDevice, setPreviewDevice] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="h-full flex">
      {/* Left Panel: Controls */}
      <div className="w-80 border-r p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Hero Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hero Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Hero Heading</Label>
                <Input
                  value={props.heroHeading}
                  onChange={(e) => props.onHeroHeadingChange(e.target.value)}
                  placeholder="Austin's Premier Party Supply Delivery"
                />
              </div>
              
              <div>
                <Label>Hero Subheading</Label>
                <Input
                  value={props.heroSubheading}
                  onChange={(e) => props.onHeroSubheadingChange(e.target.value)}
                  placeholder="Satisfaction Guaranteed, On-Time Delivery"
                />
              </div>
            </CardContent>
          </Card>

          {/* Logo Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Logo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Logo
              </Button>
              {props.logoUrl && (
                <img src={props.logoUrl} alt="Logo" className="h-16 object-contain rounded border p-2" />
              )}
              
              <div>
                <Label>Logo Size: {props.logoSize}px</Label>
                <Slider
                  value={[props.logoSize]}
                  onValueChange={props.onLogoSizeChange}
                  min={32}
                  max={120}
                  step={4}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Logo Vertical Position: {props.logoVerticalPos}px</Label>
                <Slider
                  value={[props.logoVerticalPos]}
                  onValueChange={props.onLogoVerticalChange}
                  min={-50}
                  max={50}
                  step={2}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Text Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Text Sizing & Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Headline Size: {props.headlineSize}px</Label>
                <Slider
                  value={[props.headlineSize]}
                  onValueChange={props.onHeadlineSizeChange}
                  min={18}
                  max={48}
                  step={2}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Headline Vertical Position: {props.headlineVerticalPos}px</Label>
                <Slider
                  value={[props.headlineVerticalPos]}
                  onValueChange={props.onHeadlineVerticalChange}
                  min={-30}
                  max={30}
                  step={2}
                  className="mt-2"
                />
              </div>
              
              <div>
                <Label>Subheadline Vertical Position: {props.subheadlineVerticalPos}px</Label>
                <Slider
                  value={[props.subheadlineVerticalPos]}
                  onValueChange={props.onSubheadlineVerticalChange}
                  min={-30}
                  max={30}
                  step={2}
                  className="mt-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Background */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Background</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="outline"
                onClick={() => backgroundInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Background
              </Button>
              {props.backgroundImageUrl && (
                <img src={props.backgroundImageUrl} alt="Background" className="h-20 object-cover rounded border w-full" />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel: Live Preview */}
      <div className="flex-1 p-6 bg-gradient-to-br from-muted/30 to-background/30">
        {/* Device Selector */}
        <div className="flex justify-center mb-4">
          <div className="flex bg-muted rounded-lg p-1">
            <Button
              variant={previewDevice === 'mobile' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewDevice('mobile')}
            >
              <Smartphone className="w-4 h-4" />
            </Button>
            <Button
              variant={previewDevice === 'tablet' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewDevice('tablet')}
            >
              <Tablet className="w-4 h-4" />
            </Button>
            <Button
              variant={previewDevice === 'desktop' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setPreviewDevice('desktop')}
            >
              <Monitor className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex justify-center">
          <DeliveryAppLivePreview
            appName={props.appName}
            heroHeading={props.heroHeading}
            heroSubheading={props.heroSubheading}
            logoUrl={props.logoUrl}
            logoSize={props.logoSize}
            headlineSize={props.headlineSize}
            logoVerticalPos={props.logoVerticalPos}
            headlineVerticalPos={props.headlineVerticalPos}
            subheadlineVerticalPos={props.subheadlineVerticalPos}
            backgroundImageUrl={props.backgroundImageUrl}
            tabs={props.tabs}
            device={previewDevice}
          />
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        onChange={props.onLogoUpload}
        className="hidden"
      />
      <input
        ref={backgroundInputRef}
        type="file"
        accept="image/*"
        onChange={props.onBackgroundUpload}
        className="hidden"
      />
    </div>
  );
};