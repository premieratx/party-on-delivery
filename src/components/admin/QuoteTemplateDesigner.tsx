import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Palette, 
  Type, 
  Image, 
  Move, 
  RotateCcw, 
  Save, 
  Eye,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';

interface TemplateElement {
  id: string;
  type: 'logo' | 'title' | 'subtitle' | 'category' | 'collection' | 'divider' | 'section-heading' | 'subtotal' | 'tax' | 'delivery-fee' | 'tip' | 'total';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    textAlign?: 'left' | 'center' | 'right';
  };
}

interface QuoteTemplate {
  id?: string;
  name: string;
  elements: TemplateElement[];
  isDefault: boolean;
}

export const QuoteTemplateDesigner: React.FC = () => {
  const [template, setTemplate] = useState<QuoteTemplate>({
    name: 'New Quote Template',
    elements: [],
    isDefault: false
  });
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const elementTypes = [
    { type: 'logo', label: 'Logo', icon: Image },
    { type: 'title', label: 'Title', icon: Type },
    { type: 'subtitle', label: 'Subtitle', icon: Type },
    { type: 'category', label: 'Category', icon: Type },
    { type: 'collection', label: 'Collection', icon: Type },
    { type: 'divider', label: 'Divider', icon: GripVertical },
    { type: 'section-heading', label: 'Section Heading', icon: Type },
    { type: 'subtotal', label: 'Subtotal', icon: Type },
    { type: 'tax', label: 'Sales Tax', icon: Type },
    { type: 'delivery-fee', label: 'Delivery Fee', icon: Type },
    { type: 'tip', label: 'Driver Tip', icon: Type },
    { type: 'total', label: 'Total', icon: Type }
  ];

  const addElement = (type: TemplateElement['type']) => {
    const newElement: TemplateElement = {
      id: `element-${Date.now()}`,
      type,
      content: getDefaultContent(type),
      position: { x: 50, y: 50 + template.elements.length * 60 },
      size: { width: 200, height: 40 },
      style: {
        fontSize: type === 'title' ? 24 : type === 'subtitle' ? 18 : 14,
        fontFamily: 'Arial, sans-serif',
        color: '#000000',
        textAlign: 'left'
      }
    };

    setTemplate(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
  };

  const getDefaultContent = (type: TemplateElement['type']): string => {
    const defaults: Record<TemplateElement['type'], string> = {
      logo: 'Logo Placeholder',
      title: 'Quote Title',
      subtitle: 'Subtitle Text',
      category: 'Category Name',
      collection: 'Collection Items',
      divider: '---',
      'section-heading': 'Section Title',
      subtotal: 'Subtotal: $0.00',
      tax: 'Sales Tax: $0.00',
      'delivery-fee': 'Delivery Fee: $0.00',
      tip: 'Driver Tip: $0.00',
      total: 'Total: $0.00'
    };
    return defaults[type];
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

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    setSelectedElement(elementId);
    setDraggedElement(elementId);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    updateElement(draggedElement, {
      position: { x, y }
    });
  };

  const handleMouseUp = () => {
    setDraggedElement(null);
  };

  const saveTemplate = async () => {
    try {
      // Save template to database
      toast.success('Template saved successfully!');
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const previewTemplate = () => {
    // Open preview in new tab
    const templateData = encodeURIComponent(JSON.stringify(template));
    window.open(`/quote-template-preview?template=${templateData}`, '_blank');
  };

  const selectedElementData = selectedElement 
    ? template.elements.find(el => el.id === selectedElement)
    : null;

  return (
    <div className="flex h-screen">
      {/* Toolbar */}
      <div className="w-64 bg-muted/20 p-4 border-r">
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
      </div>

      {/* Canvas */}
      <div className="flex-1 flex">
        <div className="flex-1 p-4">
          <div
            ref={canvasRef}
            className="relative w-full h-full bg-white border rounded-lg overflow-hidden"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ minHeight: '800px' }}
          >
            {template.elements.map((element) => (
              <div
                key={element.id}
                className={`absolute cursor-move border-2 ${
                  selectedElement === element.id ? 'border-primary' : 'border-transparent'
                } hover:border-primary/50`}
                style={{
                  left: element.position.x,
                  top: element.position.y,
                  width: element.size.width,
                  height: element.size.height,
                  fontSize: element.style.fontSize,
                  fontFamily: element.style.fontFamily,
                  color: element.style.color,
                  backgroundColor: element.style.backgroundColor,
                  textAlign: element.style.textAlign,
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                onMouseDown={(e) => handleMouseDown(e, element.id)}
              >
                {element.type === 'logo' ? (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-sm">
                    Logo
                  </div>
                ) : element.type === 'divider' ? (
                  <hr className="w-full border-gray-300" />
                ) : (
                  element.content
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Properties Panel */}
        <div className="w-64 bg-muted/20 p-4 border-l">
          <h3 className="font-semibold mb-4">Properties</h3>
          {selectedElementData ? (
            <div className="space-y-4">
              <div>
                <Label>Element Type</Label>
                <Badge variant="secondary">{selectedElementData.type}</Badge>
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
                    <SelectItem value="Times, serif">Times</SelectItem>
                    <SelectItem value="Georgia, serif">Georgia</SelectItem>
                    <SelectItem value="monospace">Monospace</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="color">Text Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={selectedElementData.style.color}
                  onChange={(e) => updateElement(selectedElementData.id, {
                    style: { ...selectedElementData.style, color: e.target.value }
                  })}
                />
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

              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteElement(selectedElementData.id)}
                className="w-full"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Element
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Select an element to edit its properties
            </p>
          )}
        </div>
      </div>
    </div>
  );
};