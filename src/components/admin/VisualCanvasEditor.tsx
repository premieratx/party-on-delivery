import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, FabricText, FabricImage, Rect, Circle } from 'fabric';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Type, 
  Image as ImageIcon, 
  Square, 
  Circle as CircleIcon, 
  Upload, 
  Move,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import { toast } from 'sonner';

interface CanvasElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  content: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  rotation?: number;
  locked?: boolean;
  visible?: boolean;
}

interface VisualCanvasEditorProps {
  width?: number;
  height?: number;
  backgroundColor?: string;
  elements?: CanvasElement[];
  onElementsChange?: (elements: CanvasElement[]) => void;
  onBackgroundChange?: (color: string) => void;
  className?: string;
  theme?: any;
}

export const VisualCanvasEditor: React.FC<VisualCanvasEditorProps> = ({
  width = 800,
  height = 600,
  backgroundColor = '#ffffff',
  elements = [],
  onElementsChange,
  onBackgroundChange,
  className = '',
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any>(null);
  const [canvasElements, setCanvasElements] = useState<CanvasElement[]>(elements);
  const [activeTab, setActiveTab] = useState('elements');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Fabric.js canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width,
      height,
      backgroundColor,
      selection: true,
      preserveObjectStacking: true,
    });

    // Canvas event handlers
    canvas.on('selection:created', (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on('selection:updated', (e) => {
      setSelectedObject(e.selected?.[0]);
    });

    canvas.on('selection:cleared', () => {
      setSelectedObject(null);
    });

    canvas.on('object:modified', () => {
      updateElementsFromCanvas(canvas);
    });

    canvas.on('object:moving', () => {
      updateElementsFromCanvas(canvas);
    });

    canvas.on('object:scaling', () => {
      updateElementsFromCanvas(canvas);    
    });

    canvas.on('object:rotating', () => {
      updateElementsFromCanvas(canvas);
    });

    setFabricCanvas(canvas);

    return () => {
      canvas.dispose();
    };
  }, [width, height]);

  // Update canvas background when backgroundColor changes
  useEffect(() => {
    if (fabricCanvas) {
      fabricCanvas.backgroundColor = backgroundColor;
      fabricCanvas.renderAll();
    }
  }, [backgroundColor, fabricCanvas]);

  // Load elements onto canvas
  useEffect(() => {
    if (!fabricCanvas || !elements.length) return;

    fabricCanvas.clear();
    fabricCanvas.backgroundColor = backgroundColor;

    elements.forEach(element => {
      addElementToCanvas(element);
    });
  }, [elements, fabricCanvas]);

  const updateElementsFromCanvas = useCallback((canvas: FabricCanvas) => {
    const objects = canvas.getObjects();
    const updatedElements: CanvasElement[] = objects.map((obj: any, index) => ({
      id: obj.id || `element-${index}`,
      type: obj.type === 'textbox' ? 'text' : obj.type === 'image' ? 'image' : 'shape',
      content: obj.type === 'textbox' ? obj.text : obj.src || '',
      x: obj.left || 0,
      y: obj.top || 0,
      width: obj.width * (obj.scaleX || 1),
      height: obj.height * (obj.scaleY || 1),
      fontSize: obj.fontSize || 16,
      fontFamily: obj.fontFamily || 'Arial',
      color: obj.fill || '#000000',
      backgroundColor: obj.backgroundColor || 'transparent',
      rotation: obj.angle || 0,
      locked: !obj.selectable,
      visible: obj.visible !== false
    }));

    setCanvasElements(updatedElements);
    onElementsChange?.(updatedElements);
  }, [onElementsChange]);

  const addElementToCanvas = (element: CanvasElement) => {
    if (!fabricCanvas) return;

    let fabricObject: any;

    switch (element.type) {
      case 'text':
        fabricObject = new FabricText(element.content, {
          left: element.x,
          top: element.y,
          fontSize: element.fontSize || 16,
          fontFamily: element.fontFamily || 'Arial',
          fill: element.color || '#000000',
          backgroundColor: element.backgroundColor === 'transparent' ? '' : element.backgroundColor,
          angle: element.rotation || 0,
          selectable: !element.locked,
          visible: element.visible !== false,
          id: element.id
        });
        break;

      case 'shape':
        if (element.content === 'rectangle') {
          fabricObject = new Rect({
            left: element.x,
            top: element.y,
            width: element.width || 100,
            height: element.height || 60,
            fill: element.color || '#0066cc',
            angle: element.rotation || 0,
            selectable: !element.locked,
            visible: element.visible !== false,
            id: element.id
          });
        } else if (element.content === 'circle') {
          fabricObject = new Circle({
            left: element.x,
            top: element.y,
            radius: (element.width || 100) / 2,
            fill: element.color || '#0066cc',
            angle: element.rotation || 0,
            selectable: !element.locked,
            visible: element.visible !== false,
            id: element.id
          });
        }
        break;

      case 'image':
        FabricImage.fromURL(element.content).then((img) => {
          img.set({
            left: element.x,
            top: element.y,
            scaleX: (element.width || 200) / (img.width || 1),
            scaleY: (element.height || 200) / (img.height || 1),  
            angle: element.rotation || 0,
            selectable: !element.locked,
            visible: element.visible !== false,
            id: element.id
          });
          fabricCanvas.add(img);
          fabricCanvas.renderAll();
        });
        return;
    }

    if (fabricObject) {
      fabricCanvas.add(fabricObject);
      fabricCanvas.renderAll();
    }
  };

  const addText = () => {
    const newElement: CanvasElement = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: 'New Text',
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: 'Arial',
      color: theme?.colors?.text || '#000000'
    };

    addElementToCanvas(newElement);
    const updatedElements = [...canvasElements, newElement];
    setCanvasElements(updatedElements);
    onElementsChange?.(updatedElements);
  };

  const addShape = (shapeType: 'rectangle' | 'circle') => {
    const newElement: CanvasElement = {
      id: `shape-${Date.now()}`,
      type: 'shape',
      content: shapeType,
      x: 100,
      y: 100,
      width: 100,
      height: shapeType === 'circle' ? 100 : 60,
      color: theme?.colors?.primary || '#0066cc'
    };

    addElementToCanvas(newElement);
    const updatedElements = [...canvasElements, newElement];
    setCanvasElements(updatedElements);
    onElementsChange?.(updatedElements);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newElement: CanvasElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        content: imageUrl,
        x: 150,
        y: 150,
        width: 200,
        height: 200
      };

      FabricImage.fromURL(imageUrl).then((img) => {
        img.set({
          left: newElement.x,
          top: newElement.y,
          scaleX: (newElement.width || 200) / (img.width || 1),
          scaleY: (newElement.height || 200) / (img.height || 1),
          id: newElement.id
        });
        fabricCanvas?.add(img);
        fabricCanvas?.renderAll();
        
        const updatedElements = [...canvasElements, newElement];
        setCanvasElements(updatedElements);
        onElementsChange?.(updatedElements);
      });
    };
    reader.readAsDataURL(file);
  };

  const deleteSelected = () => {
    if (!fabricCanvas || !selectedObject) return;

    fabricCanvas.remove(selectedObject);
    setSelectedObject(null);
    updateElementsFromCanvas(fabricCanvas);
  };

  const duplicateSelected = () => {
    if (!fabricCanvas || !selectedObject) return;

    selectedObject.clone((clonedObj: any) => {
      clonedObj.set({
        left: clonedObj.left + 20,
        top: clonedObj.top + 20,
        id: `${selectedObject.id}-copy-${Date.now()}`
      });
      fabricCanvas.add(clonedObj);
      fabricCanvas.setActiveObject(clonedObj);
      fabricCanvas.renderAll();
      updateElementsFromCanvas(fabricCanvas);
    });
  };

  const bringToFront = () => {
    if (!fabricCanvas || !selectedObject) return;
    selectedObject.bringToFront();
    fabricCanvas.renderAll();
  };

  const sendToBack = () => {
    if (!fabricCanvas || !selectedObject) return;
    selectedObject.sendToBack();
    fabricCanvas.renderAll();
  };

  const updateSelectedProperty = (property: string, value: any) => {
    if (!selectedObject) return;

    selectedObject.set(property, value);
    fabricCanvas?.renderAll();
    updateElementsFromCanvas(fabricCanvas!);
  };

  return (
    <div className={`flex h-full bg-background ${className}`}>
      {/* Canvas Area */}
      <div className="flex-1 p-4 flex items-center justify-center bg-gray-50">
        <div className="relative border border-gray-300 shadow-lg">
          <canvas ref={canvasRef} className="max-w-full max-h-full" />
        </div>
      </div>

      {/* Right Panel - Tools */}
      <div className="w-80 border-l border-border bg-background flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Design Tools</h3>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3 m-4">
            <TabsTrigger value="elements">Add</TabsTrigger>
            <TabsTrigger value="properties">Edit</TabsTrigger>
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <TabsContent value="elements" className="space-y-4 mt-0">
              {/* Add Elements */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Add Elements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button onClick={addText} className="w-full gap-2">
                    <Type className="w-4 h-4" />
                    Add Text
                  </Button>
                  
                  <Button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="w-full gap-2"
                    variant="outline"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Add Image
                  </Button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => addShape('rectangle')} 
                      variant="outline" 
                      className="gap-2"
                    >
                      <Square className="w-4 h-4" />
                      Rectangle
                    </Button>
                    <Button 
                      onClick={() => addShape('circle')} 
                      variant="outline" 
                      className="gap-2"
                    >
                      <CircleIcon className="w-4 h-4" />
                      Circle
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              {selectedObject && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={duplicateSelected} size="sm" variant="outline">
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button onClick={deleteSelected} size="sm" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Button onClick={bringToFront} size="sm" variant="outline">
                        Bring Front
                      </Button>
                      <Button onClick={sendToBack} size="sm" variant="outline">
                        Send Back
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="properties" className="space-y-4 mt-0">
              {selectedObject ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Edit Selected</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Text Properties */}
                    {selectedObject.type === 'textbox' && (
                      <>
                        <div>
                          <Label>Text Content</Label>
                          <Input
                            value={selectedObject.text || ''}
                            onChange={(e) => updateSelectedProperty('text', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Font Size</Label>
                          <Slider
                            value={[selectedObject.fontSize || 16]}
                            onValueChange={(value) => updateSelectedProperty('fontSize', value[0])}
                            min={8}
                            max={72}
                            step={1}
                          />
                        </div>
                        <div>
                          <Label>Font Family</Label>
                          <Select
                            value={selectedObject.fontFamily || 'Arial'}
                            onValueChange={(value) => updateSelectedProperty('fontFamily', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Helvetica">Helvetica</SelectItem>
                              <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                              <SelectItem value="Georgia">Georgia</SelectItem>
                              <SelectItem value="Verdana">Verdana</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Text Color</Label>
                          <Input
                            type="color"
                            value={selectedObject.fill || '#000000'}
                            onChange={(e) => updateSelectedProperty('fill', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {/* Shape Properties */}
                    {(selectedObject.type === 'rect' || selectedObject.type === 'circle') && (
                      <>
                        <div>
                          <Label>Fill Color</Label>
                          <Input
                            type="color"
                            value={selectedObject.fill || '#0066cc'}
                            onChange={(e) => updateSelectedProperty('fill', e.target.value)}
                          />
                        </div>
                      </>
                    )}

                    {/* Common Properties */}
                    <div>
                      <Label>Opacity</Label>
                      <Slider
                        value={[(selectedObject.opacity || 1) * 100]}
                        onValueChange={(value) => updateSelectedProperty('opacity', value[0] / 100)}
                        min={0}
                        max={100}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  Select an element to edit its properties
                </div>
              )}
            </TabsContent>

            <TabsContent value="canvas" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Canvas Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Background Color</Label>
                    <Input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => onBackgroundChange?.(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  );
};