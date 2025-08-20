import React, { useState, useCallback, useMemo } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical, 
  Type, 
  Image as ImageIcon, 
  Video, 
  Square, 
  Circle,
  Plus,
  Trash2,
  Copy,
  Eye,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Component types
interface BaseComponent {
  id: string;
  type: 'text' | 'image' | 'video' | 'button' | 'spacer' | 'divider';
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: Record<string, any>;
  content?: any;
}

interface TextComponent extends BaseComponent {
  type: 'text';
  content: {
    text: string;
    fontSize: number;
    fontWeight: string;
    color: string;
    fontFamily: string;
    textAlign: 'left' | 'center' | 'right';
  };
}

interface ImageComponent extends BaseComponent {
  type: 'image';
  content: {
    src: string;
    alt: string;
    objectFit: 'cover' | 'contain' | 'fill';
    borderRadius: number;
  };
}

interface ButtonComponent extends BaseComponent {
  type: 'button';
  content: {
    text: string;
    url: string;
    variant: 'primary' | 'secondary' | 'outline';
    backgroundColor: string;
    textColor: string;
    borderRadius: number;
  };
}

type ComponentType = TextComponent | ImageComponent | ButtonComponent;

// Component templates
const COMPONENT_TEMPLATES = {
  text: {
    type: 'text' as const,
    content: {
      text: 'Your text here',
      fontSize: 16,
      fontWeight: 'normal',
      color: '#000000',
      fontFamily: 'Inter',
      textAlign: 'left' as const
    },
    style: {},
    size: { width: 300, height: 40 }
  },
  heading: {
    type: 'text' as const,
    content: {
      text: 'Heading Text',
      fontSize: 36,
      fontWeight: 'bold',
      color: '#000000',
      fontFamily: 'Inter',
      textAlign: 'center' as const
    },
    style: {},
    size: { width: 400, height: 60 }
  },
  image: {
    type: 'image' as const,
    content: {
      src: '/api/placeholder/300/200',
      alt: 'Image',
      objectFit: 'cover' as const,
      borderRadius: 8
    },
    style: {},
    size: { width: 300, height: 200 }
  },
  button: {
    type: 'button' as const,
    content: {
      text: 'Click Me',
      url: '#',
      variant: 'primary' as const,
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      borderRadius: 8
    },
    style: {},
    size: { width: 150, height: 50 }
  }
};

// Sortable component wrapper
const SortableComponent = ({ 
  component, 
  isSelected, 
  onSelect, 
  onUpdate, 
  onDelete 
}: { 
  component: ComponentType; 
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<ComponentType>) => void;
  onDelete: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: component.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const renderComponent = () => {
    switch (component.type) {
      case 'text':
        return (
          <div
            style={{
              fontSize: component.content.fontSize,
              fontWeight: component.content.fontWeight,
              color: component.content.color,
              fontFamily: component.content.fontFamily,
              textAlign: component.content.textAlign,
              width: component.size.width,
              height: component.size.height,
              ...component.style
            }}
          >
            {component.content.text}
          </div>
        );
      
      case 'image':
        return (
          <img
            src={component.content.src}
            alt={component.content.alt}
            style={{
              width: component.size.width,
              height: component.size.height,
              objectFit: component.content.objectFit,
              borderRadius: component.content.borderRadius,
              ...component.style
            }}
          />
        );
      
      case 'button':
        return (
          <button
            style={{
              width: component.size.width,
              height: component.size.height,
              backgroundColor: component.content.backgroundColor,
              color: component.content.textColor,
              borderRadius: component.content.borderRadius,
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer',
              ...component.style
            }}
          >
            {component.content.text}
          </button>
        );
      
      default:
        return <div>Unknown component</div>;
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group p-2 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={onSelect}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10"
      >
        <div className="bg-gray-700 text-white p-1 rounded">
          <GripVertical className="w-4 h-4" />
        </div>
      </div>

      {/* Component controls */}
      {isSelected && (
        <div className="absolute -top-2 right-0 flex gap-1 z-10">
          <Button size="sm" variant="secondary" className="h-6 w-6 p-0">
            <Copy className="w-3 h-3" />
          </Button>
          <Button size="sm" variant="secondary" className="h-6 w-6 p-0">
            <Settings className="w-3 h-3" />
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            className="h-6 w-6 p-0"
            onClick={onDelete}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      )}

      {renderComponent()}
    </div>
  );
};

// Properties panel
const PropertiesPanel = ({ 
  component, 
  onUpdate 
}: { 
  component: ComponentType | null; 
  onUpdate: (updates: Partial<ComponentType>) => void;
}) => {
  if (!component) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a component to edit its properties
      </div>
    );
  }

  const updateContent = (updates: any) => {
    onUpdate({
      content: { ...component.content, ...updates }
    });
  };

  const updateSize = (updates: any) => {
    onUpdate({
      size: { ...component.size, ...updates }
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {component.type.charAt(0).toUpperCase() + component.type.slice(1)}
        </Badge>
      </div>

      {/* Size controls */}
      <div className="space-y-2">
        <Label>Size</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Width</Label>
            <Input
              type="number"
              value={component.size.width}
              onChange={(e) => updateSize({ width: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label className="text-xs">Height</Label>
            <Input
              type="number"
              value={component.size.height}
              onChange={(e) => updateSize({ height: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>
      </div>

      {/* Type-specific controls */}
      {component.type === 'text' && (
        <div className="space-y-4">
          <div>
            <Label>Text</Label>
            <Input
              value={component.content.text}
              onChange={(e) => updateContent({ text: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Font Size</Label>
              <Input
                type="number"
                value={component.content.fontSize}
                onChange={(e) => updateContent({ fontSize: parseInt(e.target.value) || 16 })}
              />
            </div>
            <div>
              <Label className="text-xs">Color</Label>
              <Input
                type="color"
                value={component.content.color}
                onChange={(e) => updateContent({ color: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {component.type === 'image' && (
        <div className="space-y-4">
          <div>
            <Label>Image URL</Label>
            <Input
              value={component.content.src}
              onChange={(e) => updateContent({ src: e.target.value })}
            />
          </div>
          
          <div>
            <Label>Alt Text</Label>
            <Input
              value={component.content.alt}
              onChange={(e) => updateContent({ alt: e.target.value })}
            />
          </div>
        </div>
      )}

      {component.type === 'button' && (
        <div className="space-y-4">
          <div>
            <Label>Button Text</Label>
            <Input
              value={component.content.text}
              onChange={(e) => updateContent({ text: e.target.value })}
            />
          </div>
          
          <div>
            <Label>URL</Label>
            <Input
              value={component.content.url}
              onChange={(e) => updateContent({ url: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Background</Label>
              <Input
                type="color"
                value={component.content.backgroundColor}
                onChange={(e) => updateContent({ backgroundColor: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs">Text Color</Label>
              <Input
                type="color"
                value={component.content.textColor}
                onChange={(e) => updateContent({ textColor: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Main drag and drop editor
export const CoverPageDragDropEditor: React.FC = () => {
  const [components, setComponents] = useState<ComponentType[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  const selectedComponentData = useMemo(() => 
    components.find(c => c.id === selectedComponent) || null,
    [components, selectedComponent]
  );

  const addComponent = useCallback((templateKey: keyof typeof COMPONENT_TEMPLATES) => {
    const baseProps = {
      id: `component-${Date.now()}`,
      position: { x: 0, y: 0 }
    };
    
    switch (templateKey) {
      case 'text': {
        const newComponent: TextComponent = {
          ...baseProps,
          type: 'text',
          content: COMPONENT_TEMPLATES.text.content,
          size: COMPONENT_TEMPLATES.text.size,
          style: COMPONENT_TEMPLATES.text.style
        };
        setComponents(prev => [...prev, newComponent]);
        setSelectedComponent(newComponent.id);
        break;
      }
      case 'heading': {
        const newComponent: TextComponent = {
          ...baseProps,
          type: 'text',
          content: COMPONENT_TEMPLATES.heading.content,
          size: COMPONENT_TEMPLATES.heading.size,
          style: COMPONENT_TEMPLATES.heading.style
        };
        setComponents(prev => [...prev, newComponent]);
        setSelectedComponent(newComponent.id);
        break;
      }
      case 'image': {
        const newComponent: ImageComponent = {
          ...baseProps,
          type: 'image',
          content: COMPONENT_TEMPLATES.image.content,
          size: COMPONENT_TEMPLATES.image.size,
          style: COMPONENT_TEMPLATES.image.style
        };
        setComponents(prev => [...prev, newComponent]);
        setSelectedComponent(newComponent.id);
        break;
      }
      case 'button': {
        const newComponent: ButtonComponent = {
          ...baseProps,
          type: 'button',
          content: COMPONENT_TEMPLATES.button.content,
          size: COMPONENT_TEMPLATES.button.size,
          style: COMPONENT_TEMPLATES.button.style
        };
        setComponents(prev => [...prev, newComponent]);
        setSelectedComponent(newComponent.id);
        break;
      }
      default:
        return;
    }
    
    toast.success('Component added');
  }, []);

  const updateComponent = useCallback((id: string, updates: Partial<ComponentType>) => {
    setComponents(prev => prev.map(comp => {
      if (comp.id !== id) return comp;
      
      // Type-safe component update
      switch (comp.type) {
        case 'text': {
          const textUpdates = updates as Partial<TextComponent>;
          return { ...comp, ...textUpdates } as TextComponent;
        }
        case 'image': {
          const imageUpdates = updates as Partial<ImageComponent>;
          return { ...comp, ...imageUpdates } as ImageComponent;
        }
        case 'button': {
          const buttonUpdates = updates as Partial<ButtonComponent>;
          return { ...comp, ...buttonUpdates } as ButtonComponent;
        }
        default:
          return comp;
      }
    }));
  }, []);

  const deleteComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
    if (selectedComponent === id) {
      setSelectedComponent(null);
    }
    toast.success('Component deleted');
  }, [selectedComponent]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      setComponents(prev => {
        const oldIndex = prev.findIndex(item => item.id === active.id);
        const newIndex = prev.findIndex(item => item.id === over?.id);
        
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
    
    setActiveId(null);
  }, []);

  const saveLayout = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('cover_pages')
        .upsert({
          slug: `drag-drop-${Date.now()}`,
          title: 'Drag & Drop Layout',
          subtitle: 'Created with visual editor',
          styles: JSON.stringify({ components }),
          is_active: true
        });

      if (error) throw error;
      toast.success('Layout saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save layout');
    }
  }, [components]);

  if (previewMode) {
    return (
      <div className="fixed inset-0 bg-white z-50">
        <div className="absolute top-4 right-4">
          <Button onClick={() => setPreviewMode(false)}>
            Exit Preview
          </Button>
        </div>
        
        <div className="h-full overflow-auto p-8">
          {components.map(component => (
            <div key={component.id} className="mb-4">
              <SortableComponent
                component={component}
                isSelected={false}
                onSelect={() => {}}
                onUpdate={() => {}}
                onDelete={() => {}}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Component Library */}
      <div className="w-64 border-r bg-background p-4">
        <h3 className="font-semibold mb-4">Components</h3>
        
        <div className="grid gap-2">
          {Object.entries(COMPONENT_TEMPLATES).map(([key, template]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => addComponent(key as keyof typeof COMPONENT_TEMPLATES)}
              className="justify-start"
            >
              {key === 'text' || key === 'heading' ? <Type className="w-4 h-4 mr-2" /> :
               key === 'image' ? <ImageIcon className="w-4 h-4 mr-2" /> :
               key === 'button' ? <Square className="w-4 h-4 mr-2" /> : null}
              {key.charAt(0).toUpperCase() + key.slice(1)}
            </Button>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-col gap-2">
            <Button onClick={() => setPreviewMode(true)} variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button onClick={saveLayout} size="sm">
              Save Layout
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-gray-50 p-4 overflow-auto">
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="max-w-4xl mx-auto bg-white min-h-96 p-8 rounded-lg shadow-sm">
            <SortableContext items={components.map(c => c.id)} strategy={verticalListSortingStrategy}>
              {components.map(component => (
                <SortableComponent
                  key={component.id}
                  component={component}
                  isSelected={selectedComponent === component.id}
                  onSelect={() => setSelectedComponent(component.id)}
                  onUpdate={(updates) => updateComponent(component.id, updates)}
                  onDelete={() => deleteComponent(component.id)}
                />
              ))}
            </SortableContext>
          </div>
          
          <DragOverlay>
            {activeId ? (
              <div className="opacity-75">
                Component being dragged
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Properties Panel */}
      <div className="w-80 border-l bg-background">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Properties</h3>
        </div>
        
        <PropertiesPanel
          component={selectedComponentData}
          onUpdate={(updates) => {
            if (selectedComponent) {
              updateComponent(selectedComponent, updates);
            }
          }}
        />
      </div>
    </div>
  );
};