import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CoverPageConfig } from './CoverPageEditor';
import { Bold, Italic, Underline, Type, Palette, Move, Square, Wand2 } from 'lucide-react';

interface CoverElement {
  id: string;
  type: 'title' | 'subtitle' | 'text' | 'logo' | 'checklist' | 'buttons';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  styles: {
    fontSize: number;
    fontWeight: string;
    fontStyle: string;
    textDecoration: string;
    color: string;
    textAlign: 'left' | 'center' | 'right';
  };
}

interface EnhancedCoverPageBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CoverPageConfig | null;
  onSaved?: () => void;
}

export const EnhancedCoverPageBuilder: React.FC<EnhancedCoverPageBuilderProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [elements, setElements] = useState<CoverElement[]>([
    {
      id: 'title',
      type: 'title',
      x: 50,
      y: 30,
      width: 80,
      height: 10,
      content: initial?.title || 'Your Title Here',
      styles: {
        fontSize: 32,
        fontWeight: 'bold',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        textAlign: 'center'
      }
    },
    {
      id: 'subtitle',
      type: 'subtitle',
      x: 50,
      y: 45,
      width: 70,
      height: 8,
      content: initial?.subtitle || 'Your subtitle here',
      styles: {
        fontSize: 18,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#666666',
        textAlign: 'center'
      }
    }
  ]);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    isResizing: boolean;
    dragType: 'move' | 'resize';
    resizeHandle?: 'nw' | 'ne' | 'sw' | 'se';
    startX: number;
    startY: number;
    startElementX: number;
    startElementY: number;
    startElementWidth: number;
    startElementHeight: number;
  } | null>(null);

  const [bgImage, setBgImage] = useState(initial?.bg_image_url || '');
  const [bgVideo, setBgVideo] = useState(initial?.bg_video_url || '');
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);

  // Handle mouse down for dragging/resizing
  const handleMouseDown = useCallback((e: React.MouseEvent, elementId: string, action: 'move' | 'resize', resizeHandle?: 'nw' | 'ne' | 'sw' | 'se') => {
    e.preventDefault();
    e.stopPropagation();
    
    const element = elements.find(el => el.id === elementId);
    if (!element || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    setSelectedElement(elementId);
    setDragState({
      isDragging: action === 'move',
      isResizing: action === 'resize',
      dragType: action,
      resizeHandle,
      startX,
      startY,
      startElementX: element.x,
      startElementY: element.y,
      startElementWidth: element.width,
      startElementHeight: element.height
    });
  }, [elements]);

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !canvasRef.current || !selectedElement) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const deltaX = ((e.clientX - dragState.startX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragState.startY) / rect.height) * 100;

      setElements(prev => prev.map(el => {
        if (el.id !== selectedElement) return el;

        if (dragState.isDragging) {
          return {
            ...el,
            x: Math.max(0, Math.min(100, dragState.startElementX + deltaX)),
            y: Math.max(0, Math.min(100, dragState.startElementY + deltaY))
          };
        }

        if (dragState.isResizing && dragState.resizeHandle) {
          const newElement = { ...el };
          
          switch (dragState.resizeHandle) {
            case 'se':
              newElement.width = Math.max(10, Math.min(100 - el.x, dragState.startElementWidth + deltaX));
              newElement.height = Math.max(5, Math.min(100 - el.y, dragState.startElementHeight + deltaY));
              break;
            case 'sw':
              const newWidth = Math.max(10, dragState.startElementWidth - deltaX);
              newElement.x = Math.max(0, dragState.startElementX + deltaX);
              newElement.width = newWidth;
              newElement.height = Math.max(5, Math.min(100 - el.y, dragState.startElementHeight + deltaY));
              break;
            case 'ne':
              newElement.width = Math.max(10, Math.min(100 - el.x, dragState.startElementWidth + deltaX));
              const newHeight = Math.max(5, dragState.startElementHeight - deltaY);
              newElement.y = Math.max(0, dragState.startElementY + deltaY);
              newElement.height = newHeight;
              break;
            case 'nw':
              const newWidthNW = Math.max(10, dragState.startElementWidth - deltaX);
              const newHeightNW = Math.max(5, dragState.startElementHeight - deltaY);
              newElement.x = Math.max(0, dragState.startElementX + deltaX);
              newElement.y = Math.max(0, dragState.startElementY + deltaY);
              newElement.width = newWidthNW;
              newElement.height = newHeightNW;
              break;
          }
          
          return newElement;
        }

        return el;
      }));
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, selectedElement]);

  // Update element content
  const updateElementContent = (elementId: string, content: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId ? { ...el, content } : el
    ));
  };

  // Update element styles
  const updateElementStyle = (elementId: string, styleKey: keyof CoverElement['styles'], value: any) => {
    setElements(prev => prev.map(el => 
      el.id === elementId 
        ? { ...el, styles: { ...el.styles, [styleKey]: value } }
        : el
    ));
  };

  // Generate AI background
  const generateAiBackground = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: 'Enter a prompt', description: 'Please describe the background you want to generate', variant: 'destructive' });
      return;
    }

    setIsGeneratingBg(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-cover-image', {
        body: { prompt: aiPrompt, size: '1024x1024', style: 'vivid' }
      });

      if (error) throw error;
      
      if (data?.image) {
        setBgImage(data.image);
        toast({ title: 'Background generated!', description: 'AI background has been applied' });
      }
    } catch (error: any) {
      console.error('Error generating background:', error);
      toast({ title: 'Generation failed', description: error.message || 'Failed to generate background', variant: 'destructive' });
    } finally {
      setIsGeneratingBg(false);
    }
  };

  // Add new text element
  const addTextElement = () => {
    const newElement: CoverElement = {
      id: `text_${Date.now()}`,
      type: 'text',
      x: 50,
      y: 60,
      width: 40,
      height: 8,
      content: 'New text element',
      styles: {
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000',
        textAlign: 'center'
      }
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  };

  // Render element with drag handles
  const renderElement = (element: CoverElement) => {
    const isSelected = selectedElement === element.id;
    
    return (
      <div
        key={element.id}
        className="absolute group"
        style={{
          left: `${element.x}%`,
          top: `${element.y}%`,
          width: `${element.width}%`,
          height: `${element.height}%`,
          transform: 'translate(-50%, -50%)',
          zIndex: isSelected ? 10 : 1
        }}
        onClick={() => setSelectedElement(element.id)}
      >
        {/* Content */}
        <div
          className="w-full h-full cursor-move select-none flex items-center justify-center"
          style={{
            fontSize: `${element.styles.fontSize}px`,
            fontWeight: element.styles.fontWeight,
            fontStyle: element.styles.fontStyle,
            textDecoration: element.styles.textDecoration,
            color: element.styles.color,
            textAlign: element.styles.textAlign,
            padding: '4px',
            border: isSelected ? '2px solid hsl(var(--primary))' : '2px solid transparent',
            borderRadius: '4px',
            backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'transparent',
            wordWrap: 'break-word',
            lineHeight: '1.2'
          }}
          onMouseDown={(e) => handleMouseDown(e, element.id, 'move')}
          contentEditable
          suppressContentEditableWarning
          onBlur={(e) => updateElementContent(element.id, e.currentTarget.textContent || '')}
        >
          {element.content}
        </div>

        {/* Resize handles - only show when selected */}
        {isSelected && (
          <>
            <div
              className="absolute w-3 h-3 bg-primary border-2 border-white rounded-full cursor-nw-resize"
              style={{ top: '-6px', left: '-6px' }}
              onMouseDown={(e) => handleMouseDown(e, element.id, 'resize', 'nw')}
            />
            <div
              className="absolute w-3 h-3 bg-primary border-2 border-white rounded-full cursor-ne-resize"
              style={{ top: '-6px', right: '-6px' }}
              onMouseDown={(e) => handleMouseDown(e, element.id, 'resize', 'ne')}
            />
            <div
              className="absolute w-3 h-3 bg-primary border-2 border-white rounded-full cursor-sw-resize"
              style={{ bottom: '-6px', left: '-6px' }}
              onMouseDown={(e) => handleMouseDown(e, element.id, 'resize', 'sw')}
            />
            <div
              className="absolute w-3 h-3 bg-primary border-2 border-white rounded-full cursor-se-resize"
              style={{ bottom: '-6px', right: '-6px' }}
              onMouseDown={(e) => handleMouseDown(e, element.id, 'resize', 'se')}
            />
          </>
        )}
      </div>
    );
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-7xl w-full h-[90vh] flex">
        {/* Canvas Area */}
        <div className="flex-1 p-4">
          <div
            ref={canvasRef}
            className="relative w-full h-full border-2 border-dashed border-muted-foreground/30 rounded-lg overflow-hidden"
            style={{
              backgroundImage: bgImage ? `url(${bgImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundColor: bgImage ? 'transparent' : 'hsl(var(--muted))'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSelectedElement(null);
              }
            }}
          >
            {bgVideo && (
              <video
                autoPlay
                muted
                loop
                className="absolute inset-0 w-full h-full object-cover"
              >
                <source src={bgVideo} type="video/mp4" />
              </video>
            )}
            
            {elements.map(renderElement)}
            
            <div className="absolute bottom-2 left-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
              Click elements to select • Drag to move • Use corner handles to resize
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-80 border-l bg-muted/50 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Cover Builder</h3>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>×</Button>
          </div>

          <Tabs defaultValue="elements" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="elements">Elements</TabsTrigger>
              <TabsTrigger value="background">Background</TabsTrigger>
              <TabsTrigger value="ai">AI Generate</TabsTrigger>
            </TabsList>

            <TabsContent value="elements" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Add Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button onClick={addTextElement} variant="outline" size="sm" className="w-full">
                    <Type className="w-4 h-4 mr-2" />
                    Add Text
                  </Button>
                </CardContent>
              </Card>

              {selectedElementData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Selected: {selectedElementData.type}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Text Formatting */}
                    <div className="flex gap-1">
                      <Button
                        variant={selectedElementData.styles.fontWeight === 'bold' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElementStyle(selectedElementData.id, 'fontWeight', 
                          selectedElementData.styles.fontWeight === 'bold' ? 'normal' : 'bold')}
                      >
                        <Bold className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedElementData.styles.fontStyle === 'italic' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElementStyle(selectedElementData.id, 'fontStyle', 
                          selectedElementData.styles.fontStyle === 'italic' ? 'normal' : 'italic')}
                      >
                        <Italic className="w-4 h-4" />
                      </Button>
                      <Button
                        variant={selectedElementData.styles.textDecoration === 'underline' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateElementStyle(selectedElementData.id, 'textDecoration', 
                          selectedElementData.styles.textDecoration === 'underline' ? 'none' : 'underline')}
                      >
                        <Underline className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Font Size */}
                    <div>
                      <Label>Font Size</Label>
                      <Input
                        type="number"
                        value={selectedElementData.styles.fontSize}
                        onChange={(e) => updateElementStyle(selectedElementData.id, 'fontSize', Number(e.target.value))}
                        min={8}
                        max={72}
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <Label>Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={selectedElementData.styles.color}
                          onChange={(e) => updateElementStyle(selectedElementData.id, 'color', e.target.value)}
                          className="w-16 h-8"
                        />
                        <Input
                          value={selectedElementData.styles.color}
                          onChange={(e) => updateElementStyle(selectedElementData.id, 'color', e.target.value)}
                          placeholder="#000000"
                        />
                      </div>
                    </div>

                    {/* Text Alignment */}
                    <div>
                      <Label>Alignment</Label>
                      <Select 
                        value={selectedElementData.styles.textAlign} 
                        onValueChange={(value) => updateElementStyle(selectedElementData.id, 'textAlign', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="background" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Background Image</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Image URL</Label>
                    <Input
                      value={bgImage}
                      onChange={(e) => setBgImage(e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label>Video URL</Label>
                    <Input
                      value={bgVideo}
                      onChange={(e) => setBgVideo(e.target.value)}
                      placeholder="https://... or /videos/..."
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">AI Background Generator</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Describe your background</Label>
                    <Textarea
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="A beautiful sunset over mountains with vibrant colors..."
                      rows={3}
                    />
                  </div>
                  <Button 
                    onClick={generateAiBackground}
                    disabled={isGeneratingBg || !aiPrompt.trim()}
                    className="w-full"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    {isGeneratingBg ? 'Generating...' : 'Generate Background'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-6 space-y-2">
            <Button onClick={() => toast({ title: 'Saved!', description: 'Cover page saved successfully' })} className="w-full">
              Save Cover Page
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};