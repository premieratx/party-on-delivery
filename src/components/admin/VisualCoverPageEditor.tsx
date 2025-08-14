import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Draggable from 'react-draggable';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';
import {
  Layout,
  Type,
  Image,
  Video,
  MousePointer,
  Eye,
  Save,
  Plus,
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Smartphone,
  Monitor,
  Upload,
  Link,
  Users
} from 'lucide-react';

// Real device configurations with exact manufactured dimensions
const DEVICE_CONFIGS = {
  desktop: {
    name: 'Desktop',
    icon: Monitor,
    width: 1200,
    height: 800,
    scale: 0.6
  },
  iphone14: {
    name: 'iPhone 14 Pro',
    icon: Smartphone,
    width: 393,
    height: 852,
    scale: 1
  },
  galaxyS23: {
    name: 'Galaxy S23',
    icon: Smartphone,
    width: 360,
    height: 780,
    scale: 1
  },
  pixel7: {
    name: 'Pixel 7',
    icon: Smartphone,
    width: 412,
    height: 915,
    scale: 1
  }
};

interface CoverElement {
  id: string;
  type: 'title' | 'subtitle' | 'text' | 'button' | 'logo' | 'image';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  textAlign: 'left' | 'center' | 'right';
  color: string;
  backgroundColor: string;
  borderRadius: number;
  zIndex: number;
  // Button specific properties
  buttonType?: 'delivery_app' | 'checkout' | 'url' | 'affiliate';
  buttonUrl?: string;
  affiliateCode?: string;
  deliveryAppSlug?: string;
}

interface VisualCoverPageEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (settings: any) => void;
  initialData?: any;
  existingCoverPages?: any[];
}

export const VisualCoverPageEditor: React.FC<VisualCoverPageEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  existingCoverPages = []
}) => {
  const [activeDevice, setActiveDevice] = useState<keyof typeof DEVICE_CONFIGS>('iphone14');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [elements, setElements] = useState<CoverElement[]>([]);
  const [backgroundType, setBackgroundType] = useState<'color' | 'gradient' | 'image' | 'video'>('gradient');
  const [backgroundValue, setBackgroundValue] = useState('linear-gradient(135deg, #667eea 0%, #764ba2 100%)');
  const [coverPageTitle, setCoverPageTitle] = useState('');
  const [coverPageSlug, setCoverPageSlug] = useState('');
  const [selectedCoverPage, setSelectedCoverPage] = useState<any>(null);
  const [affiliateCode, setAffiliateCode] = useState('');
  const [deliveryApps, setDeliveryApps] = useState<any[]>([]);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadDeliveryApps();
      if (initialData) {
        loadCoverPageData(initialData);
      }
    }
  }, [isOpen, initialData]);

  const loadDeliveryApps = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      setDeliveryApps(data || []);
    } catch (error) {
      console.error('Error loading delivery apps:', error);
    }
  };

  const loadCoverPageData = (coverPage: any) => {
    setSelectedCoverPage(coverPage);
    setCoverPageTitle(coverPage.title || '');
    setCoverPageSlug(coverPage.slug || '');
    setAffiliateCode(coverPage.affiliate_code || '');
    
    // Load existing elements if any
    if (coverPage.elements) {
      setElements(coverPage.elements);
    } else {
      // Create default elements from legacy data
      const defaultElements: CoverElement[] = [];
      
      if (coverPage.title) {
        defaultElements.push({
          id: 'title-1',
          type: 'title',
          content: coverPage.title,
          x: 50,
          y: 100,
          width: 300,
          height: 60,
          fontSize: 32,
          fontWeight: 'bold',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'center',
          color: '#ffffff',
          backgroundColor: 'transparent',
          borderRadius: 0,
          zIndex: 1
        });
      }
      
      if (coverPage.subtitle) {
        defaultElements.push({
          id: 'subtitle-1',
          type: 'subtitle',
          content: coverPage.subtitle,
          x: 50,
          y: 180,
          width: 300,
          height: 40,
          fontSize: 18,
          fontWeight: 'normal',
          fontStyle: 'normal',
          textDecoration: 'none',
          textAlign: 'center',
          color: '#e2e8f0',
          backgroundColor: 'transparent',
          borderRadius: 0,
          zIndex: 1
        });
      }
      
      setElements(defaultElements);
    }
    
    // Load background settings
    if (coverPage.background_type) {
      setBackgroundType(coverPage.background_type);
      setBackgroundValue(coverPage.background_value || backgroundValue);
    }
  };

  const addElement = (type: CoverElement['type']) => {
    const device = DEVICE_CONFIGS[activeDevice];
    const newElement: CoverElement = {
      id: `${type}-${Date.now()}`,
      type,
      content: type === 'title' ? 'New Title' : 
               type === 'subtitle' ? 'New Subtitle' :
               type === 'text' ? 'New Text' :
               type === 'button' ? 'Button Text' :
               'Element',
      x: 50,
      y: 50,
      width: type === 'button' ? 120 : 200,
      height: type === 'button' ? 40 : type === 'title' ? 50 : 30,
      fontSize: type === 'title' ? 28 : type === 'subtitle' ? 18 : 16,
      fontWeight: type === 'title' ? 'bold' : 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      color: '#ffffff',
      backgroundColor: type === 'button' ? '#3b82f6' : 'transparent',
      borderRadius: type === 'button' ? 8 : 0,
      zIndex: elements.length + 1
    };
    
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const updateElement = (id: string, updates: Partial<CoverElement>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const handleElementDrag = (id: string, data: any) => {
    updateElement(id, { x: data.x, y: data.y });
  };

  const handleElementResize = (id: string, size: { width: number; height: number }) => {
    updateElement(id, size);
  };

  const handleFileUpload = async (file: File, elementId?: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('cover-assets')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('cover-assets')
        .getPublicUrl(fileName);

      if (elementId) {
        updateElement(elementId, { content: urlData.publicUrl });
      } else {
        setBackgroundValue(urlData.publicUrl);
      }

      toast.success('File uploaded successfully');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    }
  };

  const saveCoverPage = async () => {
    try {
      const coverPageData = {
        title: coverPageTitle,
        slug: coverPageSlug || coverPageTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        elements,
        background_type: backgroundType,
        background_value: backgroundValue,
        affiliate_code: affiliateCode,
        device_config: activeDevice,
        is_active: true
      };

      let result;
      if (selectedCoverPage?.id) {
        // Update existing
        result = await supabase
          .from('cover_pages')
          .update(coverPageData)
          .eq('id', selectedCoverPage.id);
      } else {
        // Create new
        result = await supabase
          .from('cover_pages')
          .insert([coverPageData]);
      }

      if (result.error) throw result.error;

      toast.success('Cover page saved successfully!');
      onSave(coverPageData);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error('Failed to save cover page');
    }
  };

  const generateAffiliateLink = (element: CoverElement) => {
    if (element.buttonType === 'affiliate' && affiliateCode) {
      return `${window.location.origin}?ref=${affiliateCode}`;
    } else if (element.buttonType === 'delivery_app' && element.deliveryAppSlug) {
      return `${window.location.origin}/app/${element.deliveryAppSlug}${affiliateCode ? `?ref=${affiliateCode}` : ''}`;
    }
    return element.buttonUrl || '#';
  };

  const renderElement = (element: CoverElement) => {
    const isSelected = selectedElement === element.id;
    const device = DEVICE_CONFIGS[activeDevice];
    
    const elementStyle = {
      fontSize: `${element.fontSize}px`,
      fontWeight: element.fontWeight,
      fontStyle: element.fontStyle,
      textDecoration: element.textDecoration,
      textAlign: element.textAlign as any,
      color: element.color,
      backgroundColor: element.backgroundColor,
      borderRadius: `${element.borderRadius}px`,
      zIndex: element.zIndex,
      border: isSelected ? '2px solid #3b82f6' : 'none',
      cursor: previewMode ? 'default' : 'move',
      padding: element.type === 'button' ? '8px 16px' : '4px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: element.textAlign === 'center' ? 'center' : 
                     element.textAlign === 'right' ? 'flex-end' : 'flex-start'
    };

    const content = (
      <div
        style={elementStyle}
        onClick={() => !previewMode && setSelectedElement(element.id)}
        className="select-none"
      >
        {element.type === 'image' ? (
          <img src={element.content} alt="Element" className="w-full h-full object-cover" />
        ) : element.type === 'logo' ? (
          <img src={element.content} alt="Logo" className="w-full h-full object-contain" />
        ) : (
          element.content
        )}
      </div>
    );

    if (previewMode) {
      return (
        <div
          key={element.id}
          style={{
            position: 'absolute',
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height
          }}
        >
          {content}
        </div>
      );
    }

    return (
      <Draggable
        key={element.id}
        position={{ x: element.x, y: element.y }}
        onStop={(e, data) => handleElementDrag(element.id, data)}
        bounds="parent"
        disabled={previewMode}
      >
        <div style={{ position: 'absolute', zIndex: element.zIndex }}>
          <ResizableBox
            width={element.width}
            height={element.height}
            onResize={(e, { size }) => handleElementResize(element.id, size)}
            minConstraints={[50, 20]}
            maxConstraints={[device.width - element.x, device.height - element.y]}
            resizeHandles={['se']}
          >
            {content}
          </ResizableBox>
        </div>
      </Draggable>
    );
  };

  const renderPreview = () => {
    const device = DEVICE_CONFIGS[activeDevice];
    
    const backgroundStyle = {
      background: backgroundType === 'color' ? backgroundValue :
                 backgroundType === 'gradient' ? backgroundValue :
                 backgroundType === 'image' ? `url(${backgroundValue})` :
                 backgroundValue,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };

    return (
      <div className="flex items-center justify-center min-h-[600px] bg-muted/20 p-4">
        <div
          ref={canvasRef}
          style={{
            width: device.width,
            height: device.height,
            ...backgroundStyle,
            transform: `scale(${device.scale})`,
            transformOrigin: 'top left',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            borderRadius: '8px'
          }}
          className="relative"
        >
          {backgroundType === 'video' && (
            <video
              autoPlay
              loop
              muted
              className="absolute inset-0 w-full h-full object-cover"
              src={backgroundValue}
            />
          )}
          
          {elements.map(renderElement)}
          
          {!previewMode && (
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {device.name} ({device.width}×{device.height})
            </div>
          )}
        </div>
      </div>
    );
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-7xl h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Layout className="w-6 h-6" />
              Visual Cover Page Editor
            </h2>
            {selectedCoverPage && (
              <div className="text-sm text-muted-foreground">
                Editing: {selectedCoverPage.title}
              </div>
            )}
          </div>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Settings Panel */}
          <div className="w-80 border-r p-6 overflow-y-auto">
            {/* Cover Page Selection */}
            {existingCoverPages.length > 0 && (
              <div className="space-y-4 mb-6">
                <Label className="text-sm font-semibold">Edit Existing Cover Page</Label>
                <Select onValueChange={(value) => {
                  const coverPage = existingCoverPages.find(cp => cp.id === value);
                  if (coverPage) loadCoverPageData(coverPage);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a cover page to edit" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingCoverPages.map((cp) => (
                      <SelectItem key={cp.id} value={cp.id}>
                        {cp.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Separator />
              </div>
            )}

            {/* Basic Settings */}
            <div className="space-y-4 mb-6">
              <div>
                <Label>Cover Page Title</Label>
                <Input
                  value={coverPageTitle}
                  onChange={(e) => setCoverPageTitle(e.target.value)}
                  placeholder="Enter title"
                />
              </div>
              
              <div>
                <Label>URL Slug</Label>
                <Input
                  value={coverPageSlug}
                  onChange={(e) => setCoverPageSlug(e.target.value)}
                  placeholder="url-friendly-name"
                />
              </div>

              <div>
                <Label>Affiliate Code</Label>
                <Input
                  value={affiliateCode}
                  onChange={(e) => setAffiliateCode(e.target.value)}
                  placeholder="AFFILIATE123"
                />
              </div>
            </div>

            <Separator className="my-4" />

            {/* Device Selector */}
            <div className="space-y-4 mb-6">
              <Label className="text-sm font-semibold">Device Preview</Label>
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

            {/* Element Library */}
            <div className="space-y-4 mb-6">
              <Label className="text-sm font-semibold">Add Elements</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('title')}
                  className="flex items-center gap-2"
                >
                  <Type className="w-4 h-4" />
                  Title
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('subtitle')}
                  className="flex items-center gap-2"
                >
                  <Type className="w-4 h-4" />
                  Subtitle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('text')}
                  className="flex items-center gap-2"
                >
                  <Type className="w-4 h-4" />
                  Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('button')}
                  className="flex items-center gap-2"
                >
                  <MousePointer className="w-4 h-4" />
                  Button
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('logo')}
                  className="flex items-center gap-2"
                >
                  <Image className="w-4 h-4" />
                  Logo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addElement('image')}
                  className="flex items-center gap-2"
                >
                  <Image className="w-4 h-4" />
                  Image
                </Button>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Element Properties */}
            {selectedElementData && (
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Element Properties</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteElement(selectedElementData.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div>
                  <Label>Content</Label>
                  {selectedElementData.type === 'image' || selectedElementData.type === 'logo' ? (
                    <div className="space-y-2">
                      <Input
                        value={selectedElementData.content}
                        onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                        placeholder="Image URL"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </Button>
                    </div>
                  ) : (
                    <Textarea
                      value={selectedElementData.content}
                      onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                      rows={2}
                    />
                  )}
                </div>

                {/* Typography Controls */}
                {['title', 'subtitle', 'text', 'button'].includes(selectedElementData.type) && (
                  <>
                    <div>
                      <Label>Font Size: {selectedElementData.fontSize}px</Label>
                      <Slider
                        value={[selectedElementData.fontSize]}
                        onValueChange={([value]) => updateElement(selectedElementData.id, { fontSize: value })}
                        min={12}
                        max={72}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={selectedElementData.fontWeight === 'bold' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedElementData.id, { 
                          fontWeight: selectedElementData.fontWeight === 'bold' ? 'normal' : 'bold' 
                        })}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedElementData.fontStyle === 'italic' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedElementData.id, { 
                          fontStyle: selectedElementData.fontStyle === 'italic' ? 'normal' : 'italic' 
                        })}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedElementData.textDecoration === 'underline' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedElementData.id, { 
                          textDecoration: selectedElementData.textDecoration === 'underline' ? 'none' : 'underline' 
                        })}
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant={selectedElementData.textAlign === 'left' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedElementData.id, { textAlign: 'left' })}
                      >
                        <AlignLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedElementData.textAlign === 'center' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedElementData.id, { textAlign: 'center' })}
                      >
                        <AlignCenter className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedElementData.textAlign === 'right' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElement(selectedElementData.id, { textAlign: 'right' })}
                      >
                        <AlignRight className="w-4 h-4" />
                      </Button>
                    </div>

                    <div>
                      <Label>Text Color</Label>
                      <Input
                        type="color"
                        value={selectedElementData.color}
                        onChange={(e) => updateElement(selectedElementData.id, { color: e.target.value })}
                      />
                    </div>
                  </>
                )}

                {/* Button-specific properties */}
                {selectedElementData.type === 'button' && (
                  <>
                    <div>
                      <Label>Background Color</Label>
                      <Input
                        type="color"
                        value={selectedElementData.backgroundColor}
                        onChange={(e) => updateElement(selectedElementData.id, { backgroundColor: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Border Radius: {selectedElementData.borderRadius}px</Label>
                      <Slider
                        value={[selectedElementData.borderRadius]}
                        onValueChange={([value]) => updateElement(selectedElementData.id, { borderRadius: value })}
                        min={0}
                        max={50}
                        step={1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Button Action</Label>
                      <Select
                        value={selectedElementData.buttonType || 'url'}
                        onValueChange={(value) => updateElement(selectedElementData.id, { buttonType: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="url">Custom URL</SelectItem>
                          <SelectItem value="affiliate">Affiliate Link</SelectItem>
                          <SelectItem value="delivery_app">Delivery App</SelectItem>
                          <SelectItem value="checkout">Direct Checkout</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedElementData.buttonType === 'url' && (
                      <div>
                        <Label>URL</Label>
                        <Input
                          value={selectedElementData.buttonUrl || ''}
                          onChange={(e) => updateElement(selectedElementData.id, { buttonUrl: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                    )}

                    {selectedElementData.buttonType === 'delivery_app' && (
                      <div>
                        <Label>Delivery App</Label>
                        <Select
                          value={selectedElementData.deliveryAppSlug || ''}
                          onValueChange={(value) => updateElement(selectedElementData.id, { deliveryAppSlug: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select delivery app" />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryApps.map((app) => (
                              <SelectItem key={app.id} value={app.app_slug}>
                                {app.app_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {(selectedElementData.buttonType === 'affiliate' || selectedElementData.buttonType === 'delivery_app') && (
                      <div className="text-sm text-muted-foreground">
                        <Label>Generated Link:</Label>
                        <div className="mt-1 p-2 bg-muted rounded text-xs break-all">
                          {generateAffiliateLink(selectedElementData)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <Separator className="my-4" />

            {/* Background Settings */}
            <div className="space-y-4 mb-6">
              <Label className="text-sm font-semibold">Background</Label>
              
              <div>
                <Label>Background Type</Label>
                <Select value={backgroundType} onValueChange={(value) => setBackgroundType(value as any)}>
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
                    value={backgroundValue}
                    onChange={(e) => setBackgroundValue(e.target.value)}
                    placeholder={backgroundType === 'color' ? '#000000' : 
                               backgroundType === 'gradient' ? 'linear-gradient(...)' :
                               'URL or upload file'}
                  />
                  {(backgroundType === 'image' || backgroundType === 'video') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

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
                onClick={saveCoverPage}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Cover Page
              </Button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="flex-1 overflow-auto">
            {renderPreview()}
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              if (selectedElementData && (selectedElementData.type === 'image' || selectedElementData.type === 'logo')) {
                handleFileUpload(file, selectedElementData.id);
              } else {
                handleFileUpload(file);
              }
            }
          }}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
};