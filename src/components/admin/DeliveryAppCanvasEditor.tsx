import React, { useState, useRef, useEffect } from 'react';
import { Canvas as FabricCanvas, Circle, Rect, FabricText, FabricImage } from 'fabric';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Minus, 
  Type, 
  Image, 
  Square, 
  Circle as CircleIcon,
  Save,
  Eye,
  Trash2,
  Copy,
  Move3D,
  Palette,
  Layout,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface Tab {
  index: number;
  name: string;
  collection_handle: string;
}

interface OccasionButton {
  title: string;
  collection_handle: string;
  enabled: boolean;
}

interface DeliveryAppConfig {
  id?: string;
  app_name: string;
  app_slug: string;
  logo_url?: string;
  hero_heading: string;
  hero_subheading: string;
  scrolling_text: string;
  hero_background_color?: string;
  is_homepage: boolean;
  is_active: boolean;
  tabs: Tab[];
  occasion_buttons: OccasionButton[];
}

interface DeliveryAppCanvasEditorProps {
  config: DeliveryAppConfig;
  onChange: (config: DeliveryAppConfig) => void;
  onSave: () => void;
  saving?: boolean;
  availableCollections: any[];
}

export const DeliveryAppCanvasEditor: React.FC<DeliveryAppCanvasEditorProps> = ({
  config,
  onChange,
  onSave,
  saving = false,
  availableCollections = []
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'image' | 'rectangle' | 'circle'>('select');
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [activeTab, setActiveTab] = useState('design');

  // Device preview options
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  const deviceSizes = {
    mobile: { width: 375, height: 667 },
    tablet: { width: 768, height: 1024 },
    desktop: { width: 1200, height: 800 }
  };

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const size = deviceSizes[deviceType];
    const canvas = new FabricCanvas(canvasRef.current, {
      width: size.width,
      height: size.height,
      backgroundColor: config.hero_background_color || '#ffffff',
    });

    // Initialize with app content
    initializeCanvasContent(canvas);

    // Set up event handlers
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0] || null);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    setFabricCanvas(canvas);
    toast.success('Canvas ready! Start designing your delivery app!');

    return () => {
      canvas.dispose();
    };
  }, [deviceType, config.hero_background_color]);

  const initializeCanvasContent = (canvas: FabricCanvas) => {
    // Add hero heading
    const heading = new FabricText(config.hero_heading, {
      left: 20,
      top: 50,
      fontSize: 32,
      fontWeight: 'bold',
      fill: '#000000',
      id: 'hero-heading'
    });
    canvas.add(heading);

    // Add hero subheading
    const subheading = new FabricText(config.hero_subheading, {
      left: 20,
      top: 100,
      fontSize: 18,
      fill: '#666666',
      id: 'hero-subheading'
    });
    canvas.add(subheading);

    // Add scrolling text
    const scrollingText = new FabricText(config.scrolling_text, {
      left: 20,
      top: 150,
      fontSize: 14,
      fill: '#888888',
      id: 'scrolling-text'
    });
    canvas.add(scrollingText);

    // Add tabs as buttons
    config.tabs.forEach((tab, index) => {
      const tabButton = new Rect({
        left: 20 + (index * 90),
        top: 200,
        width: 80,
        height: 40,
        fill: '#3B82F6',
        rx: 8,
        ry: 8,
        id: `tab-${index}`
      });

      const tabText = new FabricText(tab.name, {
        left: 30 + (index * 90),
        top: 210,
        fontSize: 12,
        fill: '#ffffff',
        selectable: false,
        id: `tab-text-${index}`
      });

      canvas.add(tabButton);
      canvas.add(tabText);
    });
  };

  const handleToolClick = (tool: typeof selectedTool) => {
    setSelectedTool(tool);

    if (!fabricCanvas) return;

    if (tool === 'text') {
      const text = new FabricText('New Text', {
        left: 100,
        top: 100,
        fontSize: 20,
        fill: '#000000',
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
    } else if (tool === 'rectangle') {
      const rect = new Rect({
        left: 100,
        top: 100,
        width: 100,
        height: 60,
        fill: '#3B82F6',
        rx: 8,
        ry: 8,
      });
      fabricCanvas.add(rect);
      fabricCanvas.setActiveObject(rect);
    } else if (tool === 'circle') {
      const circle = new Circle({
        left: 100,
        top: 100,
        radius: 30,
        fill: '#10B981',
      });
      fabricCanvas.add(circle);
      fabricCanvas.setActiveObject(circle);
    }

    fabricCanvas?.renderAll();
  };

  const handleDeleteSelected = () => {
    if (fabricCanvas && selectedObject) {
      fabricCanvas.remove(selectedObject);
      setSelectedObject(null);
      fabricCanvas.renderAll();
    }
  };

  const handleDuplicateSelected = () => {
    if (fabricCanvas && selectedObject) {
      selectedObject.clone((cloned: any) => {
        cloned.set({
          left: selectedObject.left + 10,
          top: selectedObject.top + 10,
        });
        fabricCanvas.add(cloned);
        fabricCanvas.setActiveObject(cloned);
        fabricCanvas.renderAll();
      });
    }
  };

  const updateObjectProperty = (property: string, value: any) => {
    if (selectedObject) {
      selectedObject.set(property, value);
      fabricCanvas?.renderAll();
    }
  };

  const addTab = () => {
    if (config.tabs.length < 8) {
      const newTabs = [...config.tabs, {
        index: config.tabs.length,
        name: 'New Tab',
        collection_handle: availableCollections[0]?.handle || 'beer'
      }];
      onChange({ ...config, tabs: newTabs });
    }
  };

  const removeTab = (index: number) => {
    if (config.tabs.length > 1) {
      const newTabs = config.tabs.filter((_, i) => i !== index).map((tab, i) => ({ ...tab, index: i }));
      onChange({ ...config, tabs: newTabs });
    }
  };

  const updateTab = (index: number, field: keyof Tab, value: string) => {
    const newTabs = config.tabs.map((tab, i) => 
      i === index ? { ...tab, [field]: value } : tab
    );
    onChange({ ...config, tabs: newTabs });
  };

  const addOccasionButton = () => {
    const newButtons = [...config.occasion_buttons, {
      title: 'New Occasion',
      collection_handle: availableCollections[0]?.handle || 'beer',
      enabled: true
    }];
    onChange({ ...config, occasion_buttons: newButtons });
  };

  const removeOccasionButton = (index: number) => {
    const newButtons = config.occasion_buttons.filter((_, i) => i !== index);
    onChange({ ...config, occasion_buttons: newButtons });
  };

  const updateOccasionButton = (index: number, field: keyof OccasionButton, value: any) => {
    const newButtons = config.occasion_buttons.map((button, i) => 
      i === index ? { ...button, [field]: value } : button
    );
    onChange({ ...config, occasion_buttons: newButtons });
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
    if (previewMode && config.app_slug) {
      window.open(`/app/${config.app_slug}`, '_blank');
    }
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Left Panel - Tools & Properties */}
      <div className="w-80 border-r bg-card">
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-4">Delivery App Designer</h3>
          
          {/* Device Selector */}
          <div className="mb-4">
            <Label>Preview Device</Label>
            <Select value={deviceType} onValueChange={(value: 'mobile' | 'tablet' | 'desktop') => setDeviceType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">📱 Mobile</SelectItem>
                <SelectItem value="tablet">📱 Tablet</SelectItem>
                <SelectItem value="desktop">💻 Desktop</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tools */}
          <div className="flex gap-2 mb-4">
            <Button
              size="sm"
              variant={selectedTool === 'select' ? 'default' : 'outline'}
              onClick={() => setSelectedTool('select')}
            >
              <Move3D className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'text' ? 'default' : 'outline'}
              onClick={() => handleToolClick('text')}
            >
              <Type className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'rectangle' ? 'default' : 'outline'}
              onClick={() => handleToolClick('rectangle')}
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant={selectedTool === 'circle' ? 'default' : 'outline'}
              onClick={() => handleToolClick('circle')}
            >
              <CircleIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant="outline" onClick={handleDeleteSelected} disabled={!selectedObject}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleDuplicateSelected} disabled={!selectedObject}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs for different panels */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full mx-4 grid-cols-3">
            <TabsTrigger value="design">Design</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="p-4">
              <TabsContent value="design" className="space-y-4">
                {/* Object Properties */}
                {selectedObject && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Selected Object</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedObject.type === 'textbox' && (
                        <>
                          <div>
                            <Label>Text</Label>
                            <Input
                              value={selectedObject.text || ''}
                              onChange={(e) => updateObjectProperty('text', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Font Size</Label>
                            <Input
                              type="number"
                              value={selectedObject.fontSize || 16}
                              onChange={(e) => updateObjectProperty('fontSize', parseInt(e.target.value))}
                            />
                          </div>
                        </>
                      )}
                      <div>
                        <Label>Fill Color</Label>
                        <Input
                          type="color"
                          value={selectedObject.fill || '#000000'}
                          onChange={(e) => updateObjectProperty('fill', e.target.value)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Background Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Background</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <Label>Background Color</Label>
                      <Input
                        type="color"
                        value={config.hero_background_color || '#ffffff'}
        onChange={(e) => {
          onChange({ ...config, hero_background_color: e.target.value });
          if (fabricCanvas) {
            fabricCanvas.backgroundColor = e.target.value;
            fabricCanvas.renderAll();
          }
        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                {/* Basic App Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">App Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label>App Name</Label>
                      <Input
                        value={config.app_name}
                        onChange={(e) => onChange({ ...config, app_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Hero Heading</Label>
                      <Input
                        value={config.hero_heading}
                        onChange={(e) => onChange({ ...config, hero_heading: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Hero Subheading</Label>
                      <Input
                        value={config.hero_subheading}
                        onChange={(e) => onChange({ ...config, hero_subheading: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Scrolling Text</Label>
                      <Input
                        value={config.scrolling_text}
                        onChange={(e) => onChange({ ...config, scrolling_text: e.target.value })}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Product Tabs */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Product Tabs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {config.tabs.map((tab, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <Input
                          value={tab.name}
                          onChange={(e) => updateTab(index, 'name', e.target.value)}
                          className="flex-1"
                          placeholder="Tab Name"
                        />
                        <Select
                          value={tab.collection_handle}
                          onValueChange={(value) => updateTab(index, 'collection_handle', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCollections.map((collection) => (
                              <SelectItem key={collection.handle} value={collection.handle}>
                                {collection.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeTab(index)}
                          disabled={config.tabs.length <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addTab}
                      disabled={config.tabs.length >= 8}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tab
                    </Button>
                  </CardContent>
                </Card>

                {/* Occasion Buttons */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Occasion Buttons</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {config.occasion_buttons.map((button, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded">
                        <Input
                          value={button.title}
                          onChange={(e) => updateOccasionButton(index, 'title', e.target.value)}
                          className="flex-1"
                          placeholder="Button Title"
                        />
                        <Select
                          value={button.collection_handle}
                          onValueChange={(value) => updateOccasionButton(index, 'collection_handle', value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableCollections.map((collection) => (
                              <SelectItem key={collection.handle} value={collection.handle}>
                                {collection.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeOccasionButton(index)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      onClick={addOccasionButton}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Occasion Button
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">App Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Active</Label>
                      <input
                        type="checkbox"
                        checked={config.is_active}
                        onChange={(e) => onChange({ ...config, is_active: e.target.checked })}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Set as Homepage</Label>
                      <input
                        type="checkbox"
                        checked={config.is_homepage}
                        onChange={(e) => onChange({ ...config, is_homepage: e.target.checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Center Panel - Canvas */}
      <div className="flex-1 flex flex-col bg-muted/20">
        {/* Canvas Header */}
        <div className="p-4 border-b bg-background">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={previewMode ? 'default' : 'secondary'}>
                {previewMode ? 'Preview Mode' : 'Design Mode'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {deviceType} • {deviceSizes[deviceType].width}×{deviceSizes[deviceType].height}
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePreview}>
                <Eye className="h-4 w-4 mr-2" />
                {previewMode ? 'Design' : 'Preview'}
              </Button>
              <Button onClick={onSave} disabled={saving} size="sm">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="relative border rounded-lg shadow-lg bg-white">
            <canvas ref={canvasRef} className="block" />
          </div>
        </div>
      </div>
    </div>
  );
};