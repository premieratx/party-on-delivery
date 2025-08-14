import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { 
  Type, 
  Image, 
  Save, 
  Eye,
  Plus,
  Trash2,
  GripVertical,
  Upload,
  Palette,
  Bold,
  Italic,
  Underline,
  Copy,
  RotateCcw
} from 'lucide-react';

interface TemplateElement {
  id: string;
  type: 'logo' | 'title' | 'subtitle' | 'category' | 'collection' | 'divider' | 'section-heading' | 'subtotal' | 'tax' | 'delivery-fee' | 'tip' | 'total' | 'payment-options' | 'address-section';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'underline';
  };
}

interface QuoteTemplate {
  id?: string;
  name: string;
  elements: TemplateElement[];
  isDefault: boolean;
  category: 'modern' | 'classic' | 'minimal' | 'elegant';
}

const PRE_MADE_TEMPLATES: QuoteTemplate[] = [
  {
    id: 'modern-1',
    name: 'Modern Standard',
    category: 'modern',
    isDefault: false,
    elements: [
      {
        id: 'logo-1',
        type: 'logo',
        content: 'Company Logo',
        position: { x: 50, y: 30 },
        size: { width: 120, height: 60 },
        style: { fontSize: 14, fontFamily: 'Arial, sans-serif', color: '#000000', textAlign: 'center' }
      },
      {
        id: 'title-1',
        type: 'title',
        content: 'Event Quote',
        position: { x: 200, y: 40 },
        size: { width: 300, height: 40 },
        style: { fontSize: 28, fontFamily: 'Arial, sans-serif', color: '#2563eb', textAlign: 'left', fontWeight: 'bold' }
      },
      {
        id: 'subtitle-1',
        type: 'subtitle',
        content: 'Professional Event Services',
        position: { x: 200, y: 85 },
        size: { width: 300, height: 25 },
        style: { fontSize: 16, fontFamily: 'Arial, sans-serif', color: '#64748b', textAlign: 'left' }
      },
      {
        id: 'section-1',
        type: 'section-heading',
        content: 'Premium Beverages',
        position: { x: 50, y: 150 },
        size: { width: 200, height: 30 },
        style: { fontSize: 20, fontFamily: 'Arial, sans-serif', color: '#1e293b', textAlign: 'left', fontWeight: 'bold' }
      },
      {
        id: 'collection-1',
        type: 'collection',
        content: 'Premium wine selection, craft cocktails, top-shelf spirits',
        position: { x: 50, y: 190 },
        size: { width: 450, height: 60 },
        style: { fontSize: 14, fontFamily: 'Arial, sans-serif', color: '#475569', textAlign: 'left' }
      }
    ]
  },
  {
    id: 'classic-1',
    name: 'Classic Elegant',
    category: 'classic',
    isDefault: false,
    elements: [
      {
        id: 'title-2',
        type: 'title',
        content: 'Event Proposal',
        position: { x: 150, y: 40 },
        size: { width: 300, height: 50 },
        style: { fontSize: 32, fontFamily: 'Georgia, serif', color: '#1f2937', textAlign: 'center', fontWeight: 'bold' }
      },
      {
        id: 'divider-1',
        type: 'divider',
        content: '---',
        position: { x: 100, y: 100 },
        size: { width: 400, height: 2 },
        style: { fontSize: 14, fontFamily: 'Arial, sans-serif', color: '#d1d5db', textAlign: 'center' }
      },
      {
        id: 'logo-2',
        type: 'logo',
        content: 'Company Logo',
        position: { x: 225, y: 120 },
        size: { width: 150, height: 75 },
        style: { fontSize: 14, fontFamily: 'Arial, sans-serif', color: '#000000', textAlign: 'center' }
      }
    ]
  },
  {
    id: 'minimal-1',
    name: 'Minimal Clean',
    category: 'minimal',
    isDefault: false,
    elements: [
      {
        id: 'title-3',
        type: 'title',
        content: 'Quote',
        position: { x: 50, y: 50 },
        size: { width: 100, height: 40 },
        style: { fontSize: 24, fontFamily: 'Helvetica, sans-serif', color: '#000000', textAlign: 'left', fontWeight: 'normal' }
      },
      {
        id: 'section-3',
        type: 'section-heading',
        content: 'Items',
        position: { x: 50, y: 120 },
        size: { width: 100, height: 25 },
        style: { fontSize: 16, fontFamily: 'Helvetica, sans-serif', color: '#6b7280', textAlign: 'left' }
      }
    ]
  }
];

export const DraggableQuoteTemplateBuilder: React.FC = () => {
  const [template, setTemplate] = useState<QuoteTemplate>({
    name: 'New Quote Template',
    elements: [],
    isDefault: false,
    category: 'modern'
  });
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const elementTypes = [
    { type: 'logo', label: 'Logo', icon: Image },
    { type: 'title', label: 'Title', icon: Type },
    { type: 'subtitle', label: 'Subtitle', icon: Type },
    { type: 'section-heading', label: 'Section Heading', icon: Type },
    { type: 'category', label: 'Category', icon: Type },
    { type: 'collection', label: 'Product Collection', icon: Type },
    { type: 'divider', label: 'Divider', icon: GripVertical },
    { type: 'subtotal', label: 'Subtotal', icon: Type },
    { type: 'tax', label: 'Sales Tax', icon: Type },
    { type: 'delivery-fee', label: 'Delivery Fee', icon: Type },
    { type: 'tip', label: 'Driver Tip', icon: Type },
    { type: 'total', label: 'Total', icon: Type },
    { type: 'payment-options', label: 'Payment Options', icon: Type },
    { type: 'address-section', label: 'Address Section', icon: Type }
  ];

  const loadTemplate = (templateData: QuoteTemplate) => {
    setTemplate({
      ...templateData,
      elements: templateData.elements.map(el => ({
        ...el,
        id: `${el.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }))
    });
    setSelectedElement(null);
  };

  const addElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: getDefaultContent(type),
      position: { x: 50, y: 50 + template.elements.length * 60 },
      size: getDefaultSize(type),
      style: getDefaultStyle(type)
    };

    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
  };

  const getDefaultContent = (type: TemplateElement['type']): string => {
    const defaults: Record<TemplateElement['type'], string> = {
      logo: 'Company Logo',
      title: 'Event Quote',
      subtitle: 'Professional Event Services',
      category: 'Premium Beverages',
      collection: 'Product items will be listed here automatically',
      divider: '---',
      'section-heading': 'Section Title',
      subtotal: 'Subtotal: $0.00',
      tax: 'Sales Tax (8.25%): $0.00',
      'delivery-fee': 'Delivery Fee: $15.00',
      tip: 'Suggested Tip (18%): $0.00',
      total: 'Total: $0.00',
      'payment-options': 'Pay 25% Deposit or Pay in Full',
      'address-section': 'Delivery Address'
    };
    return defaults[type];
  };

  const getDefaultSize = (type: TemplateElement['type']): { width: number; height: number } => {
    const sizes: Record<TemplateElement['type'], { width: number; height: number }> = {
      logo: { width: 120, height: 60 },
      title: { width: 300, height: 40 },
      subtitle: { width: 300, height: 25 },
      category: { width: 200, height: 30 },
      collection: { width: 450, height: 100 },
      divider: { width: 400, height: 2 },
      'section-heading': { width: 200, height: 30 },
      subtotal: { width: 200, height: 25 },
      tax: { width: 200, height: 25 },
      'delivery-fee': { width: 200, height: 25 },
      tip: { width: 200, height: 25 },
      total: { width: 200, height: 30 },
      'payment-options': { width: 300, height: 40 },
      'address-section': { width: 350, height: 80 }
    };
    return sizes[type];
  };

  const getDefaultStyle = (type: TemplateElement['type']) => {
    const baseStyle = {
      fontFamily: 'Arial, sans-serif',
      color: '#000000',
      textAlign: 'left' as const,
      fontWeight: 'normal' as const,
      fontStyle: 'normal' as const,
      textDecoration: 'none' as const
    };

    const styleMap: Record<TemplateElement['type'], any> = {
      logo: { ...baseStyle, fontSize: 14, textAlign: 'center' },
      title: { ...baseStyle, fontSize: 28, fontWeight: 'bold', color: '#2563eb' },
      subtitle: { ...baseStyle, fontSize: 16, color: '#64748b' },
      category: { ...baseStyle, fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
      collection: { ...baseStyle, fontSize: 14, color: '#475569' },
      divider: { ...baseStyle, fontSize: 14, color: '#d1d5db', textAlign: 'center' },
      'section-heading': { ...baseStyle, fontSize: 18, fontWeight: 'bold' },
      subtotal: { ...baseStyle, fontSize: 14 },
      tax: { ...baseStyle, fontSize: 14 },
      'delivery-fee': { ...baseStyle, fontSize: 14 },
      tip: { ...baseStyle, fontSize: 14 },
      total: { ...baseStyle, fontSize: 16, fontWeight: 'bold' },
      'payment-options': { ...baseStyle, fontSize: 14, color: '#059669' },
      'address-section': { ...baseStyle, fontSize: 14, color: '#374151' }
    };

    return styleMap[type];
  };

  const updateElement = (id: string, updates: Partial<TemplateElement>) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    }));
  };

  const deleteElement = (id: string) => {
    setTemplate(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== id)
    }));
    setSelectedElement(null);
  };

  const duplicateElement = (id: string) => {
    const elementToDuplicate = template.elements.find(el => el.id === id);
    if (elementToDuplicate) {
      const newElement = {
        ...elementToDuplicate,
        id: `${elementToDuplicate.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        position: {
          x: elementToDuplicate.position.x + 20,
          y: elementToDuplicate.position.y + 20
        }
      };
      setTemplate(prev => ({
        ...prev,
        elements: [...prev.elements, newElement]
      }));
    }
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string, handle?: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
    
    if (handle) {
      setResizeHandle(`${elementId}-${handle}`);
    } else {
      setDraggedElement(elementId);
    }
    
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent | MouseEvent) => {
    if (!dragStart) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    if (resizeHandle) {
      const [elementId, handle] = resizeHandle.split('-');
      const element = template.elements.find(el => el.id === elementId);
      if (!element) return;

      let newSize = { ...element.size };
      let newPosition = { ...element.position };

      // Get canvas bounds for constraining
      const canvas = canvasRef.current;
      const canvasBounds = canvas?.getBoundingClientRect();
      const maxWidth = canvasBounds ? canvasBounds.width - element.position.x : 1000;
      const maxHeight = canvasBounds ? canvasBounds.height - element.position.y : 1000;

      switch (handle) {
        case 'nw':
          newSize.width = Math.max(50, Math.min(maxWidth + element.position.x, element.size.width - deltaX));
          newSize.height = Math.max(20, Math.min(maxHeight + element.position.y, element.size.height - deltaY));
          newPosition.x = Math.max(0, element.position.x + (element.size.width - newSize.width));
          newPosition.y = Math.max(0, element.position.y + (element.size.height - newSize.height));
          break;
        case 'ne':
          newSize.width = Math.max(50, Math.min(maxWidth, element.size.width + deltaX));
          newSize.height = Math.max(20, Math.min(maxHeight + element.position.y, element.size.height - deltaY));
          newPosition.y = Math.max(0, element.position.y + (element.size.height - newSize.height));
          break;
        case 'sw':
          newSize.width = Math.max(50, Math.min(maxWidth + element.position.x, element.size.width - deltaX));
          newSize.height = Math.max(20, Math.min(maxHeight, element.size.height + deltaY));
          newPosition.x = Math.max(0, element.position.x + (element.size.width - newSize.width));
          break;
        case 'se':
          newSize.width = Math.max(50, Math.min(maxWidth, element.size.width + deltaX));
          newSize.height = Math.max(20, Math.min(maxHeight, element.size.height + deltaY));
          break;
      }

      updateElement(elementId, { size: newSize, position: newPosition });
    } else if (draggedElement) {
      const element = template.elements.find(el => el.id === draggedElement);
      if (!element || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const canvasBounds = canvas.getBoundingClientRect();
      
      const newX = Math.max(0, Math.min(canvasBounds.width - element.size.width, element.position.x + deltaX));
      const newY = Math.max(0, Math.min(canvasBounds.height - element.size.height, element.position.y + deltaY));

      updateElement(draggedElement, {
        position: { x: newX, y: newY }
      });
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
    setResizeHandle(null);
    setDragStart(null);
  };

  const saveTemplate = async () => {
    try {
      toast.success('Template saved successfully!');
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const previewTemplate = () => {
    const templateData = encodeURIComponent(JSON.stringify(template));
    window.open(`/quote-template-preview?template=${templateData}`, '_blank');
  };

  const selectedElementData = selectedElement 
    ? template.elements.find(el => el.id === selectedElement)
    : null;

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggedElement || resizeHandle) {
        handleMouseMove(e as any);
      }
    };

    const handleGlobalMouseUp = () => {
      handleMouseUp();
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [draggedElement, resizeHandle, dragStart]);

  const renderResizeHandles = (element: TemplateElement) => {
    if (selectedElement !== element.id) return null;

    const handles = [
      { name: 'nw', cursor: 'nw-resize', top: -6, left: -6 },
      { name: 'ne', cursor: 'ne-resize', top: -6, right: -6 },
      { name: 'sw', cursor: 'sw-resize', bottom: -6, left: -6 },
      { name: 'se', cursor: 'se-resize', bottom: -6, right: -6 }
    ];
    
    return (
      <>
        {handles.map(handle => (
          <div
            key={handle.name}
            className="absolute w-3 h-3 bg-primary border-2 border-white rounded-full shadow-md hover:scale-110 transition-transform"
            style={{
              top: handle.top,
              left: handle.left,
              right: handle.right,
              bottom: handle.bottom,
              cursor: handle.cursor,
              zIndex: 10
            }}
            onMouseDown={(e) => handleMouseDown(e, element.id, handle.name)}
          />
        ))}
        {/* Center drag handle indicator */}
        <div 
          className="absolute inset-0 border-2 border-dashed border-primary/30 pointer-events-none"
          style={{ margin: '2px' }}
        />
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center pointer-events-none"
        >
          <div className="w-2 h-2 bg-primary rounded-full" />
        </div>
      </>
    );
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-80 bg-muted/20 border-r overflow-y-auto">
        <Tabs defaultValue="elements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="elements">Elements</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>
          
          <TabsContent value="elements" className="p-4">
            <h3 className="font-semibold mb-4">Template Elements</h3>
            <div className="space-y-2">
              {elementTypes.map(({ type, label, icon: Icon }) => (
                <Button
                  key={type}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => addElement(type as TemplateElement['type'])}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {label}
                </Button>
              ))}
            </div>

            <Separator className="my-4" />

            <div className="space-y-4">
              <div>
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  value={template.name}
                  onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={template.category}
                  onValueChange={(value: QuoteTemplate['category']) => 
                    setTemplate(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modern">Modern</SelectItem>
                    <SelectItem value="classic">Classic</SelectItem>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="elegant">Elegant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button onClick={saveTemplate} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={previewTemplate} variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="p-4">
            <h3 className="font-semibold mb-4">Pre-made Templates</h3>
            <div className="space-y-3">
              {PRE_MADE_TEMPLATES.map((preTemplate) => (
                <Card key={preTemplate.id} className="cursor-pointer hover:bg-muted/50" onClick={() => loadTemplate(preTemplate)}>
                  <CardContent className="p-3">
                    <h4 className="font-medium">{preTemplate.name}</h4>
                    <Badge variant="secondary" className="mt-1">
                      {preTemplate.category}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {preTemplate.elements.length} elements
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Canvas */}
      <div className="flex-1 flex">
        <div className="flex-1 p-4">
          <div
            ref={canvasRef}
            className="relative w-full h-full bg-white border rounded-lg overflow-hidden"
            style={{ minHeight: '800px' }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {template.elements.map((element) => (
              <div
                key={element.id}
                className={`absolute transition-all duration-200 ${
                  selectedElement === element.id 
                    ? 'border-2 border-primary shadow-lg' 
                    : 'border-2 border-transparent hover:border-primary/30'
                } group`}
                style={{
                  left: element.position.x,
                  top: element.position.y,
                  width: element.size.width,
                  height: element.size.height,
                  fontSize: element.style.fontSize,
                  fontFamily: element.style.fontFamily,
                  color: element.style.color,
                  backgroundColor: element.style.backgroundColor || (selectedElement === element.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent'),
                  textAlign: element.style.textAlign,
                  fontWeight: element.style.fontWeight,
                  fontStyle: element.style.fontStyle,
                  textDecoration: element.style.textDecoration,
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: draggedElement === element.id ? 'grabbing' : (selectedElement === element.id ? 'move' : 'pointer'),
                  borderRadius: '4px',
                  userSelect: 'none',
                  zIndex: selectedElement === element.id ? 20 : 1
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              >
                {element.type === 'logo' ? (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-sm border-2 border-dashed border-gray-400 rounded">
                    <Upload className="h-6 w-6 mr-2 text-gray-500" />
                    <span className="text-gray-600">Logo</span>
                  </div>
                ) : element.type === 'divider' ? (
                  <div className="w-full flex items-center">
                    <hr className="flex-1 border-gray-300" />
                    {selectedElement === element.id && (
                      <span className="px-2 text-xs text-gray-400">Divider</span>
                    )}
                    <hr className="flex-1 border-gray-300" />
                  </div>
                ) : (
                  <div 
                    className="w-full h-full flex items-center overflow-hidden"
                    style={{
                      wordWrap: 'break-word',
                      whiteSpace: element.size.height > 30 ? 'normal' : 'nowrap'
                    }}
                  >
                    {element.content}
                  </div>
                )}
                
                {renderResizeHandles(element)}
                
                {/* Selection indicator */}
                {selectedElement === element.id && (
                  <div className="absolute -top-6 left-0 bg-primary text-white text-xs px-2 py-1 rounded text-nowrap">
                    {element.type.replace('-', ' ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-80 bg-muted/20 p-4 border-l overflow-y-auto">
          <h3 className="font-semibold mb-4">Properties</h3>
          {selectedElementData ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">{selectedElementData.type}</Badge>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => duplicateElement(selectedElementData.id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteElement(selectedElementData.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="content">Content</Label>
                <Input
                  id="content"
                  value={selectedElementData.content}
                  onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={selectedElementData.size.width}
                    onChange={(e) => updateElement(selectedElementData.id, {
                      size: { ...selectedElementData.size, width: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={selectedElementData.size.height}
                    onChange={(e) => updateElement(selectedElementData.id, {
                      size: { ...selectedElementData.size, height: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="fontSize">Font Size</Label>
                  <Input
                    id="fontSize"
                    type="number"
                    value={selectedElementData.style.fontSize}
                    onChange={(e) => updateElement(selectedElementData.id, {
                      style: { ...selectedElementData.style, fontSize: parseInt(e.target.value) }
                    })}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    type="color"
                    value={selectedElementData.style.color}
                    onChange={(e) => updateElement(selectedElementData.id, {
                      style: { ...selectedElementData.style, color: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div>
                <Label>Text Style</Label>
                <div className="flex gap-1 mt-1">
                  <Button
                    size="sm"
                    variant={selectedElementData.style.fontWeight === 'bold' ? 'default' : 'outline'}
                    onClick={() => updateElement(selectedElementData.id, {
                      style: { 
                        ...selectedElementData.style, 
                        fontWeight: selectedElementData.style.fontWeight === 'bold' ? 'normal' : 'bold'
                      }
                    })}
                  >
                    <Bold className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedElementData.style.fontStyle === 'italic' ? 'default' : 'outline'}
                    onClick={() => updateElement(selectedElementData.id, {
                      style: { 
                        ...selectedElementData.style, 
                        fontStyle: selectedElementData.style.fontStyle === 'italic' ? 'normal' : 'italic'
                      }
                    })}
                  >
                    <Italic className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedElementData.style.textDecoration === 'underline' ? 'default' : 'outline'}
                    onClick={() => updateElement(selectedElementData.id, {
                      style: { 
                        ...selectedElementData.style, 
                        textDecoration: selectedElementData.style.textDecoration === 'underline' ? 'none' : 'underline'
                      }
                    })}
                  >
                    <Underline className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="textAlign">Text Alignment</Label>
                <Select
                  value={selectedElementData.style.textAlign}
                  onValueChange={(value: 'left' | 'center' | 'right') => updateElement(selectedElementData.id, {
                    style: { ...selectedElementData.style, textAlign: value }
                  })}
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

              <div>
                <Label htmlFor="fontFamily">Font Family</Label>
                <Select
                  value={selectedElementData.style.fontFamily}
                  onValueChange={(value) => updateElement(selectedElementData.id, {
                    style: { ...selectedElementData.style, fontFamily: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                    <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                    <SelectItem value="Times, serif">Times New Roman</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="Courier, monospace">Courier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Select an element to edit its properties, or drag elements from the sidebar to get started.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};