import React, { useEffect, useMemo, useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CoverPageConfig } from './CoverPageEditor';
import { Smartphone, Monitor, Tablet, Move, RotateCcw } from 'lucide-react';

interface TextElement {
  id: string;
  type: 'title' | 'subtitle' | 'checklist';
  content: string;
  fontSize: number;
  fontFamily: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AdvancedCoverPageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CoverPageConfig | null;
  onSaved?: () => void;
}

const FONT_OPTIONS = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Oswald', label: 'Oswald' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Poppins', label: 'Poppins' }
];

export const AdvancedCoverPageEditor: React.FC<AdvancedCoverPageEditorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const { toast } = useToast();
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [textElements, setTextElements] = useState<TextElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Basic config states
  const [title, setTitle] = useState(initial?.title || "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || "");
  const [bgImageUrl, setBgImageUrl] = useState(initial?.bg_image_url || "");
  const [checklist, setChecklist] = useState<string[]>(initial?.checklist || ["", "", "", "", ""]);

  useEffect(() => {
    if (open && initial) {
      // Initialize text elements from config
      const elements: TextElement[] = [
        {
          id: 'title',
          type: 'title',
          content: initial.title || 'Title',
          fontSize: initial.styles?.title_size || 32,
          fontFamily: 'Inter',
          x: 50,
          y: 30,
          width: 400,
          height: 60
        },
        {
          id: 'subtitle',
          type: 'subtitle',
          content: initial.subtitle || 'Subtitle',
          fontSize: initial.styles?.subtitle_size || 18,
          fontFamily: 'Inter',
          x: 50,
          y: 50,
          width: 400,
          height: 40
        },
        {
          id: 'checklist',
          type: 'checklist',
          content: (initial.checklist || []).filter(Boolean).join('\n'),
          fontSize: initial.styles?.checklist_size || 14,
          fontFamily: 'Inter',
          x: 50,
          y: 70,
          width: 300,
          height: 100
        }
      ];
      setTextElements(elements);
    }
  }, [open, initial]);

  const getDeviceDimensions = () => {
    switch (activeDevice) {
      case 'mobile':
        return { width: 375, height: 667, scale: 0.6 }; // iPhone 8 dimensions
      case 'tablet':
        return { width: 768, height: 1024, scale: 0.5 }; // iPad dimensions
      default:
        return { width: 1200, height: 800, scale: 0.7 }; // Desktop
    }
  };

  const { width, height, scale } = getDeviceDimensions();

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const element = textElements.find(el => el.id === elementId);
    if (!element) return;
    
    setDragStart({
      x: e.clientX - rect.left - element.x * scale,
      y: e.clientY - rect.top - element.y * scale
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement || !canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = (e.clientX - rect.left - dragStart.x) / scale;
    const newY = (e.clientY - rect.top - dragStart.y) / scale;
    
    setTextElements(prev => 
      prev.map(el => 
        el.id === selectedElement 
          ? { ...el, x: Math.max(0, Math.min(width - el.width, newX)), y: Math.max(0, Math.min(height - el.height, newY)) }
          : el
      )
    );
  };

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  const updateElementProperty = (elementId: string, property: keyof TextElement, value: any) => {
    setTextElements(prev => 
      prev.map(el => 
        el.id === elementId ? { ...el, [property]: value } : el
      )
    );
  };

  const selectedElementData = textElements.find(el => el.id === selectedElement);

  const handleSave = async () => {
    try {
      // Convert text elements back to cover page config format
      const titleElement = textElements.find(el => el.id === 'title');
      const subtitleElement = textElements.find(el => el.id === 'subtitle');
      const checklistElement = textElements.find(el => el.id === 'checklist');
      
      const payload = {
        slug: title.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        title: titleElement?.content || title,
        subtitle: subtitleElement?.content || subtitle,
        logo_url: logoUrl || null,
        bg_image_url: bgImageUrl || null,
        checklist: checklistElement?.content.split('\n').filter(Boolean) || [],
        buttons: initial?.buttons as any || [],
        is_active: true,
        styles: {
          title_size: titleElement?.fontSize || 32,
          subtitle_size: subtitleElement?.fontSize || 18,
          checklist_size: checklistElement?.fontSize || 14,
          title_offset_y: titleElement?.y || 0,
          subtitle_offset_y: subtitleElement?.y || 0,
          checklist_offset_y: checklistElement?.y || 0,
        }
      };

      if (initial?.id) {
        const { error } = await supabase.from('cover_pages').update(payload as any).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cover_pages').insert(payload as any);
        if (error) throw error;
      }

      toast({ title: 'Saved', description: 'Cover page saved successfully' });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Advanced Cover Page Editor</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[70vh]">
          {/* Canvas Area */}
          <div className="lg:col-span-3 flex flex-col">
            {/* Device Selector */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant={activeDevice === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveDevice('desktop')}
              >
                <Monitor className="h-4 w-4 mr-1" />
                Desktop
              </Button>
              <Button
                variant={activeDevice === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveDevice('tablet')}
              >
                <Tablet className="h-4 w-4 mr-1" />
                Tablet
              </Button>
              <Button
                variant={activeDevice === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveDevice('mobile')}
              >
                <Smartphone className="h-4 w-4 mr-1" />
                Mobile
              </Button>
            </div>

            {/* Canvas */}
            <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              <div
                ref={canvasRef}
                className="relative bg-white shadow-lg border border-gray-300 overflow-hidden cursor-crosshair"
                style={{
                  width: `${width * scale}px`,
                  height: `${height * scale}px`,
                  backgroundImage: bgImageUrl ? `url(${bgImageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              >
                {/* Grid overlay */}
                <div 
                  className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{
                    backgroundImage: `
                      linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: `${20 * scale}px ${20 * scale}px`
                  }}
                />

                {/* Text Elements */}
                {textElements.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute border-2 cursor-move ${
                      selectedElement === element.id 
                        ? 'border-blue-500 bg-blue-50/20' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                    style={{
                      left: `${element.x * scale}px`,
                      top: `${element.y * scale}px`,
                      width: `${element.width * scale}px`,
                      height: `${element.height * scale}px`,
                      fontSize: `${element.fontSize * scale}px`,
                      fontFamily: element.fontFamily,
                      padding: `${4 * scale}px`,
                      userSelect: 'none'
                    }}
                    onMouseDown={(e) => handleElementMouseDown(e, element.id)}
                  >
                    {element.type === 'checklist' 
                      ? element.content.split('\n').map((item, i) => (
                          <div key={i} className="flex items-center gap-1">
                            <div 
                              className="rounded-full bg-green-500"
                              style={{ 
                                width: `${6 * scale}px`, 
                                height: `${6 * scale}px` 
                              }}
                            />
                            {item}
                          </div>
                        ))
                      : element.content
                    }
                    
                    {/* Corner resize handles */}
                    {selectedElement === element.id && (
                      <>
                        {/* Move handle in center */}
                        <div 
                          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-full p-1 cursor-move"
                          style={{ width: `${16 * scale}px`, height: `${16 * scale}px` }}
                        >
                          <Move className="h-full w-full" />
                        </div>
                        
                        {/* Corner resize handles */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 cursor-nw-resize" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 cursor-ne-resize" />
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 cursor-sw-resize" />
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 cursor-se-resize" />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Properties Panel */}
          <div className="lg:col-span-1 space-y-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Background Settings */}
                <div>
                  <Label>Background Image URL</Label>
                  <Input 
                    value={bgImageUrl} 
                    onChange={(e) => setBgImageUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <Label>Logo URL</Label>
                  <Input 
                    value={logoUrl} 
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>

                {/* Selected Element Properties */}
                {selectedElementData && (
                  <>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Selected: {selectedElementData.type}</h4>
                      
                      <div className="space-y-2">
                        <div>
                          <Label>Content</Label>
                          {selectedElementData.type === 'checklist' ? (
                            <textarea
                              className="w-full p-2 border rounded text-sm"
                              rows={4}
                              value={selectedElementData.content}
                              onChange={(e) => updateElementProperty(selectedElementData.id, 'content', e.target.value)}
                              placeholder="One item per line"
                            />
                          ) : (
                            <Input
                              value={selectedElementData.content}
                              onChange={(e) => updateElementProperty(selectedElementData.id, 'content', e.target.value)}
                            />
                          )}
                        </div>

                        <div>
                          <Label>Font Size</Label>
                          <Input
                            type="number"
                            min={8}
                            max={72}
                            value={selectedElementData.fontSize}
                            onChange={(e) => updateElementProperty(selectedElementData.id, 'fontSize', Number(e.target.value))}
                          />
                        </div>

                        <div>
                          <Label>Font Family</Label>
                          <Select
                            value={selectedElementData.fontFamily}
                            onValueChange={(value) => updateElementProperty(selectedElementData.id, 'fontFamily', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {FONT_OPTIONS.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                  {font.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>Width</Label>
                            <Input
                              type="number"
                              min={50}
                              max={800}
                              value={selectedElementData.width}
                              onChange={(e) => updateElementProperty(selectedElementData.id, 'width', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Height</Label>
                            <Input
                              type="number"
                              min={20}
                              max={400}
                              value={selectedElementData.height}
                              onChange={(e) => updateElementProperty(selectedElementData.id, 'height', Number(e.target.value))}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>X Position</Label>
                            <Input
                              type="number"
                              min={0}
                              max={width}
                              value={Math.round(selectedElementData.x)}
                              onChange={(e) => updateElementProperty(selectedElementData.id, 'x', Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <Label>Y Position</Label>
                            <Input
                              type="number"
                              min={0}
                              max={height}
                              value={Math.round(selectedElementData.y)}
                              onChange={(e) => updateElementProperty(selectedElementData.id, 'y', Number(e.target.value))}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {activeDevice === 'mobile' && 'iPhone 8 simulation (375×667)'}
            {activeDevice === 'tablet' && 'iPad simulation (768×1024)'}
            {activeDevice === 'desktop' && 'Desktop simulation (1200×800)'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};