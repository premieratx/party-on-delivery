import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  Sparkles, 
  Move, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  Play, 
  Pause,
  Download,
  Search,
  Image as ImageIcon,
  Video,
  Film,
  Type,
  Palette,
  Layout
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { stockMediaLibrary, getMediaByCategory, getAllCategories, type StockMedia } from '@/utils/stockMediaLibrary';
import { toast } from 'sonner';

interface CoverPageElement {
  id: string;
  type: 'logo' | 'title' | 'subtitle' | 'background';
  content: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    opacity?: number;
    rotation?: number;
  };
}

interface EnhancedCoverPageEditorProps {
  appId?: string;
  initialData?: any;
  onSave?: (data: any) => void;
}

export const EnhancedCoverPageEditor: React.FC<EnhancedCoverPageEditorProps> = ({
  appId,
  initialData,
  onSave
}) => {
  const [elements, setElements] = useState<CoverPageElement[]>([
    {
      id: 'background',
      type: 'background',
      content: '',
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      style: { opacity: 1 }
    },
    {
      id: 'logo',
      type: 'logo',
      content: '/src/assets/party-on-delivery-logo.png',
      position: { x: 50, y: 20 },
      size: { width: 200, height: 100 },
      style: { opacity: 1 }
    },
    {
      id: 'title',
      type: 'title',
      content: 'Exclusive Concierge Delivery',
      position: { x: 50, y: 45 },
      size: { width: 80, height: 10 },
      style: { fontSize: 36, fontFamily: 'Inter', color: '#ffffff' }
    },
    {
      id: 'subtitle',
      type: 'subtitle',
      content: "Austin's favorite alcohol delivery service",
      position: { x: 50, y: 55 },
      size: { width: 70, height: 8 },
      style: { fontSize: 18, fontFamily: 'Inter', color: '#ffffff' }
    }
  ]);

  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'tablet'>('desktop');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [stockMediaSearch, setStockMediaSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [backgroundPosition, setBackgroundPosition] = useState({ x: 50, y: 50 });
  const [backgroundScale, setBackgroundScale] = useState(100);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [showStockLibrary, setShowStockLibrary] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ isDragging: boolean; startPos: { x: number; y: number } }>({
    isDragging: false,
    startPos: { x: 0, y: 0 }
  });

  const fonts = [
    'Inter', 'Poppins', 'Roboto', 'Montserrat', 'Playfair Display', 
    'Oswald', 'Nunito', 'Space Grotesk', 'Fredoka One'
  ];

  const getFilteredStockMedia = () => {
    let filtered = stockMediaLibrary;
    
    if (selectedCategory !== 'all') {
      filtered = getMediaByCategory(selectedCategory);
    }
    
    if (stockMediaSearch) {
      filtered = filtered.filter(media => 
        media.name.toLowerCase().includes(stockMediaSearch.toLowerCase()) ||
        media.tags.some(tag => tag.toLowerCase().includes(stockMediaSearch.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const generateAIImage = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter a prompt for image generation');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-cover-image', {
        body: { 
          prompt: aiPrompt,
          size: "1024x1024",
          style: "vivid"
        }
      });

      if (error) throw error;

      if (data.success) {
        updateElement('background', { content: data.imageUrl });
        toast.success('AI image generated successfully!');
        setAiPrompt('');
      } else {
        throw new Error(data.error || 'Failed to generate image');
      }
    } catch (error) {
      console.error('Error generating AI image:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateElement = (id: string, updates: Partial<CoverPageElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const handleMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    setSelectedElement(elementId);
    dragRef.current.isDragging = true;
    dragRef.current.startPos = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.isDragging || !selectedElement) return;
    
    const deltaX = e.clientX - dragRef.current.startPos.x;
    const deltaY = e.clientY - dragRef.current.startPos.y;
    
    const element = elements.find(el => el.id === selectedElement);
    if (!element) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const newX = Math.max(0, Math.min(100, element.position.x + (deltaX / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, element.position.y + (deltaY / rect.height) * 100));
    
    updateElement(selectedElement, {
      position: { x: newX, y: newY }
    });
    
    dragRef.current.startPos = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    dragRef.current.isDragging = false;
  };

  const getPreviewDimensions = () => {
    switch (previewMode) {
      case 'mobile': return { width: 375, height: 667 };
      case 'tablet': return { width: 768, height: 1024 };
      default: return { width: 1200, height: 800 };
    }
  };

  const selectedEl = elements.find(el => el.id === selectedElement);
  const backgroundEl = elements.find(el => el.id === 'background');
  const dimensions = getPreviewDimensions();

  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Enhanced Cover Page Editor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Preview Area */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label>Preview:</Label>
                  <Select value={previewMode} onValueChange={(value: any) => setPreviewMode(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desktop">Desktop</SelectItem>
                      <SelectItem value="tablet">Tablet</SelectItem>
                      <SelectItem value="mobile">Mobile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={previewMode === 'mobile'} 
                    onCheckedChange={(checked) => setPreviewMode(checked ? 'mobile' : 'desktop')}
                  />
                  <Label>Mobile Mode</Label>
                </div>
              </div>

              <div 
                ref={canvasRef}
                className="relative border-2 border-dashed border-gray-300 rounded-lg overflow-hidden mx-auto bg-gray-100"
                style={{ 
                  width: dimensions.width / 2, 
                  height: dimensions.height / 2,
                  maxWidth: '100%'
                }}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Background */}
                {backgroundEl?.content && (
                  <div 
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${backgroundEl.content})`,
                      backgroundSize: `${backgroundScale}%`,
                      backgroundPosition: `${backgroundPosition.x}% ${backgroundPosition.y}%`,
                      backgroundRepeat: 'no-repeat',
                      opacity: backgroundEl.style.opacity
                    }}
                  />
                )}

                {/* Elements */}
                {elements.filter(el => el.type !== 'background').map((element) => (
                  <div
                    key={element.id}
                    className={`absolute cursor-move select-none ${
                      selectedElement === element.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    style={{
                      left: `${element.position.x}%`,
                      top: `${element.position.y}%`,
                      width: element.type === 'logo' ? `${element.size.width}px` : `${element.size.width}%`,
                      height: element.type === 'logo' ? `${element.size.height}px` : 'auto',
                      transform: `translate(-50%, -50%) rotate(${element.style.rotation || 0}deg)`,
                      fontSize: element.style.fontSize,
                      fontFamily: element.style.fontFamily,
                      color: element.style.color,
                      opacity: element.style.opacity
                    }}
                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                  >
                    {element.type === 'logo' ? (
                      <img 
                        src={element.content} 
                        alt="Logo" 
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    ) : (
                      <div className="font-bold text-center whitespace-nowrap">
                        {element.content}
                      </div>
                    )}
                  </div>
                ))}

                {/* Selection handles */}
                {selectedEl && (
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${selectedEl.position.x}%`,
                      top: `${selectedEl.position.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  >
                    <div className="w-2 h-2 bg-blue-500 absolute -top-1 -left-1 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-500 absolute -top-1 -right-1 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-500 absolute -bottom-1 -left-1 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-500 absolute -bottom-1 -right-1 rounded-full"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Controls Panel */}
            <div className="space-y-4">
              <Tabs defaultValue="background" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="background">BG</TabsTrigger>
                  <TabsTrigger value="elements">Elements</TabsTrigger>
                  <TabsTrigger value="ai">AI</TabsTrigger>
                  <TabsTrigger value="library">Library</TabsTrigger>
                </TabsList>

                {/* Background Controls */}
                <TabsContent value="background" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Background Position</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <div>
                          <Label className="text-xs">X: {backgroundPosition.x}%</Label>
                          <Slider
                            value={[backgroundPosition.x]}
                            onValueChange={([x]) => setBackgroundPosition(prev => ({ ...prev, x }))}
                            max={100}
                            step={1}
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Y: {backgroundPosition.y}%</Label>
                          <Slider
                            value={[backgroundPosition.y]}
                            onValueChange={([y]) => setBackgroundPosition(prev => ({ ...prev, y }))}
                            max={100}
                            step={1}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Background Scale: {backgroundScale}%</Label>
                      <Slider
                        value={[backgroundScale]}
                        onValueChange={([scale]) => setBackgroundScale(scale)}
                        min={50}
                        max={200}
                        step={5}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Animation Speed: {animationSpeed}x</Label>
                      <Slider
                        value={[animationSpeed]}
                        onValueChange={([speed]) => setAnimationSpeed(speed)}
                        min={0.1}
                        max={3}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Element Controls */}
                <TabsContent value="elements" className="space-y-4">
                  {selectedEl ? (
                    <div className="space-y-4">
                      <div>
                        <Label>Selected: {selectedEl.type}</Label>
                        <Badge variant="outline" className="ml-2">{selectedEl.id}</Badge>
                      </div>

                      {selectedEl.type !== 'background' && (
                        <div>
                          <Label>Content</Label>
                          {selectedEl.type === 'logo' ? (
                            <Input
                              value={selectedEl.content}
                              onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                              placeholder="Logo URL"
                            />
                          ) : (
                            <Textarea
                              value={selectedEl.content}
                              onChange={(e) => updateElement(selectedEl.id, { content: e.target.value })}
                              placeholder="Text content"
                            />
                          )}
                        </div>
                      )}

                      {selectedEl.type !== 'logo' && (
                        <>
                          <div>
                            <Label>Font Size: {selectedEl.style.fontSize}px</Label>
                            <Slider
                              value={[selectedEl.style.fontSize || 16]}
                              onValueChange={([size]) => updateElement(selectedEl.id, { 
                                style: { ...selectedEl.style, fontSize: size }
                              })}
                              min={12}
                              max={72}
                              step={1}
                              className="mt-2"
                            />
                          </div>

                          <div>
                            <Label>Font Family</Label>
                            <Select 
                              value={selectedEl.style.fontFamily} 
                              onValueChange={(font) => updateElement(selectedEl.id, { 
                                style: { ...selectedEl.style, fontFamily: font }
                              })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {fonts.map(font => (
                                  <SelectItem key={font} value={font}>{font}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label>Color</Label>
                            <Input
                              type="color"
                              value={selectedEl.style.color || '#ffffff'}
                              onChange={(e) => updateElement(selectedEl.id, { 
                                style: { ...selectedEl.style, color: e.target.value }
                              })}
                              className="mt-2"
                            />
                          </div>
                        </>
                      )}

                      <div>
                        <Label>Opacity: {Math.round((selectedEl.style.opacity || 1) * 100)}%</Label>
                        <Slider
                          value={[(selectedEl.style.opacity || 1) * 100]}
                          onValueChange={([opacity]) => updateElement(selectedEl.id, { 
                            style: { ...selectedEl.style, opacity: opacity / 100 }
                          })}
                          min={0}
                          max={100}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label>Rotation: {selectedEl.style.rotation || 0}°</Label>
                        <Slider
                          value={[selectedEl.style.rotation || 0]}
                          onValueChange={([rotation]) => updateElement(selectedEl.id, { 
                            style: { ...selectedEl.style, rotation }
                          })}
                          min={-180}
                          max={180}
                          step={5}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      Click an element to edit it
                    </div>
                  )}
                </TabsContent>

                {/* AI Generation */}
                <TabsContent value="ai" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>AI Image Prompt</Label>
                      <Textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe the background image you want to generate..."
                        className="mt-2"
                      />
                    </div>
                    
                    <Button 
                      onClick={generateAIImage} 
                      disabled={isGenerating || !aiPrompt.trim()}
                      className="w-full"
                    >
                      {isGenerating ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate AI Background
                        </>
                      )}
                    </Button>

                    <div className="text-sm text-muted-foreground">
                      <p><strong>Tips:</strong></p>
                      <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>Be specific about style, colors, and mood</li>
                        <li>Mention "background" or "backdrop" in your prompt</li>
                        <li>Include lighting preferences (soft, dramatic, etc.)</li>
                        <li>Specify if you want people/objects or abstract designs</li>
                      </ul>
                    </div>
                  </div>
                </TabsContent>

                {/* Stock Library */}
                <TabsContent value="library" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label>Search Stock Media</Label>
                      <Input
                        value={stockMediaSearch}
                        onChange={(e) => setStockMediaSearch(e.target.value)}
                        placeholder="Search by name or tags..."
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Category</Label>
                      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {getAllCategories().map(category => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                      {getFilteredStockMedia().map((media) => (
                        <div
                          key={media.id}
                          className="relative cursor-pointer group rounded-lg overflow-hidden border hover:border-primary transition-colors"
                          onClick={() => updateElement('background', { content: media.url })}
                        >
                          <img
                            src={media.thumbnail || media.url}
                            alt={media.name}
                            className="w-full h-20 object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="text-white text-xs text-center p-2">
                              <div className="font-medium">{media.name}</div>
                              <div className="flex items-center justify-center gap-1 mt-1">
                                {media.type === 'video' && <Video className="w-3 h-3" />}
                                {media.type === 'gif' && <Film className="w-3 h-3" />}
                                {media.type === 'image' && <ImageIcon className="w-3 h-3" />}
                                <span className="text-xs">{media.type}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2">
                <Button 
                  onClick={() => onSave?.(elements)}
                  className="flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Save Design
                </Button>
                <Button variant="outline" onClick={() => setElements([])}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};