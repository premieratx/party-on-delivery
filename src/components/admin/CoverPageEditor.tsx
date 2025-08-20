import React, { useState, useEffect, useRef } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, IText, Image as FabricImage } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Palette, 
  Type, 
  Image as ImageIcon, 
  MousePointer, 
  Save, 
  Eye,
  Smartphone,
  Monitor,
  Upload,
  Link,
  Star,
  Zap,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CoverPageComponent {
  id: string;
  type: 'logo' | 'headline' | 'subheadline' | 'feature-list' | 'primary-button' | 'secondary-button' | 'background';
  content?: string;
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
  };
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  deliveryAppSlug?: string;
}

export interface CoverPageConfig {
  id?: string;
  name: string;
  slug: string;
  components: CoverPageComponent[];
  is_active: boolean;
  is_default_homepage: boolean;
}

interface CoverPageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CoverPageConfig | null;
  onSaved?: () => void;
}

export const CoverPageEditor: React.FC<CoverPageEditorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedComponent, setSelectedComponent] = useState<CoverPageComponent | null>(null);
  const [deliveryApps, setDeliveryApps] = useState<any[]>([]);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
  const [saving, setSaving] = useState(false);

  // Form states
  const [pageName, setPageName] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isHomepage, setIsHomepage] = useState(false);

  // Default components matching Figma design
  const [components, setComponents] = useState<CoverPageComponent[]>([
    {
      id: 'background',
      type: 'background',
      style: {
        backgroundColor: '#0a0a0a', // Dark space background
      }
    },
    {
      id: 'logo',
      type: 'logo',
      content: '/lovable-uploads/ce050856-18fd-4cf7-be92-3788db8acef8.png', // Default logo
      position: { x: 200, y: 80 },
      size: { width: 120, height: 120 }
    },
    {
      id: 'headline',
      type: 'headline',
      content: 'Party On Delivery',
      position: { x: 200, y: 220 },
      style: {
        fontSize: 32,
        fontFamily: 'Inter',
        color: '#00d4ff' // Cyan blue
      }
    },
    {
      id: 'subheadline',
      type: 'subheadline',
      content: 'Premium Spirits at Your Door',
      position: { x: 200, y: 270 },
      style: {
        fontSize: 20,
        fontFamily: 'Inter',
        color: '#ffa500' // Orange/gold
      }
    },
    {
      id: 'feature-list',
      type: 'feature-list',
      content: '🍸 Craft cocktails & premium spirits\n🚚 Fast delivery in 30 minutes or less\n🎉 Perfect for any celebration',
      position: { x: 200, y: 320 },
      style: {
        fontSize: 16,
        fontFamily: 'Inter',
        color: '#ffffff'
      }
    },
    {
      id: 'primary-button',
      type: 'primary-button',
      content: 'Start Shopping',
      position: { x: 200, y: 450 },
      size: { width: 300, height: 50 },
      style: {
        backgroundColor: '#00d4ff',
        color: '#000000',
        fontSize: 18,
        fontFamily: 'Inter'
      },
      deliveryAppSlug: ''
    },
    {
      id: 'secondary-button',
      type: 'secondary-button',
      content: 'Browse Menu',
      position: { x: 200, y: 520 },
      size: { width: 300, height: 50 },
      style: {
        backgroundColor: 'transparent',
        borderColor: '#ffa500',
        borderWidth: 2,
        color: '#ffa500',
        fontSize: 18,
        fontFamily: 'Inter'
      },
      deliveryAppSlug: ''
    }
  ]);

  // Load delivery apps
  useEffect(() => {
    const loadDeliveryApps = async () => {
      try {
        const { data, error } = await supabase
          .from('delivery_app_variations')
          .select('app_slug, app_name, is_active')
          .eq('is_active', true);
        
        if (error) throw error;
        setDeliveryApps(data || []);
      } catch (error) {
        console.error('Error loading delivery apps:', error);
      }
    };

    if (open) {
      loadDeliveryApps();
    }
  }, [open]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || !open) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: previewMode === 'mobile' ? 375 : 800,
      height: previewMode === 'mobile' ? 667 : 800,
      backgroundColor: '#0a0a0a'
    });

    setFabricCanvas(canvas);

    // Add selection event listener
    canvas.on('selection:created', (e) => {
      const activeObject = e.selected?.[0];
      if (activeObject && (activeObject as any).data) {
        const componentId = (activeObject as any).data?.componentId;
        const component = components.find(c => c.id === componentId);
        setSelectedComponent(component || null);
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedComponent(null);
    });

    return () => {
      canvas.dispose();
    };
  }, [open, previewMode]);

  // Render components on canvas
  useEffect(() => {
    if (!fabricCanvas) return;

    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#0a0a0a';

    components.forEach(component => {
      if (component.type === 'background') return;

      if (component.type === 'logo' && component.content) {
        FabricImage.fromURL(component.content, {
          crossOrigin: 'anonymous'
        }).then((img) => {
          img.set({
            left: component.position?.x || 0,
            top: component.position?.y || 0,
            scaleX: (component.size?.width || 120) / (img.width || 120),
            scaleY: (component.size?.height || 120) / (img.height || 120),
            selectable: true,
            hasControls: true,
            hasBorders: true
          });
          // Fix Fabric.js data property
          (img as any).data = { componentId: component.id };
          fabricCanvas.add(img);
        });
      } else if (component.type === 'headline' || component.type === 'subheadline') {
        const text = new IText(component.content || '', {
          left: component.position?.x || 0,
          top: component.position?.y || 0,
          fontSize: component.style?.fontSize || 20,
          fontFamily: component.style?.fontFamily || 'Inter',
          fill: component.style?.color || '#ffffff',
          selectable: true,
          hasControls: true,
          hasBorders: true
        });
        (text as any).data = { componentId: component.id };
        fabricCanvas.add(text);
      } else if (component.type === 'feature-list') {
        const text = new IText(component.content || '', {
          left: component.position?.x || 0,
          top: component.position?.y || 0,
          fontSize: component.style?.fontSize || 16,
          fontFamily: component.style?.fontFamily || 'Inter',
          fill: component.style?.color || '#ffffff',
          selectable: true,
          hasControls: true,
          hasBorders: true
        });
        (text as any).data = { componentId: component.id };
        fabricCanvas.add(text);
      } else if (component.type === 'primary-button' || component.type === 'secondary-button') {
        // Create button background
        const buttonBg = new Rect({
          left: component.position?.x || 0,
          top: component.position?.y || 0,
          width: component.size?.width || 300,
          height: component.size?.height || 50,
          fill: component.style?.backgroundColor || '#00d4ff',
          stroke: component.style?.borderColor || 'transparent',
          strokeWidth: component.style?.borderWidth || 0,
          rx: 8,
          ry: 8,
          selectable: true,
          hasControls: true,
          hasBorders: true
        });
        (buttonBg as any).data = { componentId: component.id };

        // Create button text
        const buttonText = new IText(component.content || 'Button', {
          left: (component.position?.x || 0) + (component.size?.width || 300) / 2,
          top: (component.position?.y || 0) + (component.size?.height || 50) / 2,
          fontSize: component.style?.fontSize || 18,
          fontFamily: component.style?.fontFamily || 'Inter',
          fill: component.style?.color || '#000000',
          textAlign: 'center',
          originX: 'center',
          originY: 'center',
          selectable: false
        });

        fabricCanvas.add(buttonBg);
        fabricCanvas.add(buttonText);
      }
    });

    fabricCanvas.renderAll();
  }, [fabricCanvas, components]);

  // Initialize form with existing data
  useEffect(() => {
    if (!open) return;

    if (initial) {
      setPageName(initial.name || '');
      setPageSlug(initial.slug || '');
      setIsActive(initial.is_active ?? true);
      setIsHomepage(initial.is_default_homepage ?? false);
      if (initial.components) {
        setComponents(initial.components);
      }
    } else {
      // Reset for new page
      setPageName('');
      setPageSlug('');
      setIsActive(true);
      setIsHomepage(false);
      // Keep default components
    }
  }, [open, initial]);

  const updateComponent = (componentId: string, updates: Partial<CoverPageComponent>) => {
    setComponents(prev => prev.map(c => 
      c.id === componentId ? { ...c, ...updates } : c
    ));
  };

  const handleSave = async () => {
    if (!pageName.trim() || !pageSlug.trim()) {
      toast.error('Page name and slug are required');
      return;
    }

    setSaving(true);
    try {
      const pageData = {
        slug: pageSlug.trim(),
        title: pageName.trim(),
        is_active: isActive,
        is_default_homepage: isHomepage,
        styles: {
          components
        } as any,
        buttons: [] as any, // Will be populated from components
        checklist: [] as any
      };

      if (initial?.id) {
        const { error } = await supabase
          .from('cover_pages')
          .update(pageData)
          .eq('id', initial.id);
        if (error) throw error;
        toast.success('Cover page updated successfully!');
      } else {
        const { error } = await supabase
          .from('cover_pages')
          .insert(pageData);
        if (error) throw error;
        toast.success('Cover page created successfully!');
      }

      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Save error:', error);
      toast.error(error?.message || 'Failed to save cover page');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-background z-50 flex">
      {/* Left Panel - Canvas */}
      <div className="flex-1 flex flex-col border-r">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/50">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Cover Page Editor</h2>
            <div className="flex items-center gap-2">
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="w-4 h-4 mr-1" />
                Mobile
              </Button>
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="w-4 h-4 mr-1" />
                Desktop
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Page'}
            </Button>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 flex items-center justify-center p-8 bg-muted/20">
          <div className="border border-border rounded-lg shadow-lg overflow-hidden bg-white">
            <canvas ref={canvasRef} />
          </div>
        </div>
      </div>

      {/* Right Panel - Properties */}
      <div className="w-80 flex flex-col border-l bg-muted/30">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Properties</h3>
          {selectedComponent && (
            <Badge variant="secondary" className="mt-2">
              {selectedComponent.type.replace('-', ' ')}
            </Badge>
          )}
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6">
            {/* Page Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Page Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="page-name">Page Name</Label>
                  <Input
                    id="page-name"
                    value={pageName}
                    onChange={(e) => setPageName(e.target.value)}
                    placeholder="Cover Page Name"
                  />
                </div>
                <div>
                  <Label htmlFor="page-slug">Page Slug</Label>
                  <Input
                    id="page-slug"
                    value={pageSlug}
                    onChange={(e) => setPageSlug(e.target.value)}
                    placeholder="cover-page-slug"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Component Properties */}
            {selectedComponent && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm capitalize">
                    {selectedComponent.type.replace('-', ' ')} Properties
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Content */}
                  {(selectedComponent.type === 'headline' || 
                    selectedComponent.type === 'subheadline' || 
                    selectedComponent.type === 'primary-button' || 
                    selectedComponent.type === 'secondary-button') && (
                    <div>
                      <Label>Text Content</Label>
                      <Input
                        value={selectedComponent.content || ''}
                        onChange={(e) => updateComponent(selectedComponent.id, { content: e.target.value })}
                        placeholder="Enter text"
                      />
                    </div>
                  )}

                  {selectedComponent.type === 'feature-list' && (
                    <div>
                      <Label>Feature List</Label>
                      <Textarea
                        value={selectedComponent.content || ''}
                        onChange={(e) => updateComponent(selectedComponent.id, { content: e.target.value })}
                        placeholder="🍸 Feature 1&#10;🚚 Feature 2&#10;🎉 Feature 3"
                        rows={4}
                      />
                    </div>
                  )}

                  {/* Logo Upload */}
                  {selectedComponent.type === 'logo' && (
                    <div>
                      <Label>Logo URL</Label>
                      <Input
                        value={selectedComponent.content || ''}
                        onChange={(e) => updateComponent(selectedComponent.id, { content: e.target.value })}
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  )}

                  {/* Button App Assignment */}
                  {(selectedComponent.type === 'primary-button' || selectedComponent.type === 'secondary-button') && (
                    <div>
                      <Label>Assign to Delivery App</Label>
                      <Select
                        value={selectedComponent.deliveryAppSlug || ''}
                        onValueChange={(value) => updateComponent(selectedComponent.id, { deliveryAppSlug: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose delivery app" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No assignment</SelectItem>
                          {deliveryApps.map((app) => (
                            <SelectItem key={app.app_slug} value={app.app_slug}>
                              {app.app_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Color */}
                  {selectedComponent.style?.color && (
                    <div>
                      <Label>Text Color</Label>
                      <Input
                        type="color"
                        value={selectedComponent.style.color}
                        onChange={(e) => updateComponent(selectedComponent.id, {
                          style: { ...selectedComponent.style, color: e.target.value }
                        })}
                      />
                    </div>
                  )}

                  {/* Background Color */}
                  {selectedComponent.style?.backgroundColor && (
                    <div>
                      <Label>Background Color</Label>
                      <Input
                        type="color"
                        value={selectedComponent.style.backgroundColor}
                        onChange={(e) => updateComponent(selectedComponent.id, {
                          style: { ...selectedComponent.style, backgroundColor: e.target.value }
                        })}
                      />
                    </div>
                  )}

                  {/* Font Size */}
                  {selectedComponent.style?.fontSize && (
                    <div>
                      <Label>Font Size</Label>
                      <Input
                        type="number"
                        value={selectedComponent.style.fontSize}
                        onChange={(e) => updateComponent(selectedComponent.id, {
                          style: { ...selectedComponent.style, fontSize: parseInt(e.target.value) }
                        })}
                        min="8"
                        max="72"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">How to Use</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-2">
                <p>• Click any element on the canvas to select and edit it</p>
                <p>• Drag elements to reposition them</p>
                <p>• Use the handles to resize elements</p>
                <p>• Assign buttons to delivery apps using the dropdown</p>
                <p>• Toggle between mobile and desktop preview</p>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
