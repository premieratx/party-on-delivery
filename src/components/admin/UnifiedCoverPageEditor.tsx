import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UnifiedCoverPageEditor as OriginalEditor } from "./OriginalUnifiedCoverPageEditor";
import { OptimizedAnimatedPreview } from "./OptimizedAnimatedPreview";
import { FigmaTemplateSelector } from "./FigmaTemplateSelector";
import { Wand2, Layout, Sparkles, Eye } from 'lucide-react';

interface UnifiedCoverPageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

export const UnifiedCoverPageEditor: React.FC<UnifiedCoverPageEditorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('unified');
  const [config, setConfig] = useState({
    title: initial?.title || '',
    subtitle: initial?.subtitle || '',
    logoUrl: initial?.logo_url || '',
    bgImageUrl: initial?.bg_image_url || '',
    bgVideoUrl: initial?.bg_video_url || '',
    checklist: initial?.checklist || [],
    buttons: initial?.buttons || [],
    selectedTheme: 'original',
    activeDevice: 'iphone14'
  });

  const handleFigmaTemplateSelect = (templateData: any) => {
    if (templateData && !templateData.error) {
      setConfig(prev => ({
        ...prev,
        ...templateData,
        title: templateData.title || prev.title,
        subtitle: templateData.subtitle || prev.subtitle,
        logoUrl: templateData.logoUrl || prev.logoUrl,
        bgImageUrl: templateData.bgImageUrl || prev.bgImageUrl,
        checklist: templateData.checklist || prev.checklist,
        buttons: templateData.buttons || prev.buttons,
        selectedTheme: templateData.theme || prev.selectedTheme
      }));
      toast({
        title: "Template Applied",
        description: "Figma template has been applied to your cover page",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[98vw] max-h-[98vh] w-full h-full">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Professional Cover Page Editor
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-4 flex-shrink-0">
              <TabsTrigger value="unified" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="figma" className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Templates
              </TabsTrigger>
              <TabsTrigger value="animated" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Design Studio
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Preview
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-hidden mt-4">
              <TabsContent value="unified" className="h-full m-0">
                <div className="h-full overflow-y-auto">
                  <OriginalEditor
                    open={true}
                    onOpenChange={() => {}}
                    initial={initial}
                    onSaved={onSaved}
                    embedded={true}
                  />
                </div>
              </TabsContent>

              <TabsContent value="figma" className="h-full m-0">
                <div className="h-full overflow-y-auto">
                  <FigmaTemplateSelector onTemplateSelect={handleFigmaTemplateSelect} />
                </div>
              </TabsContent>

              <TabsContent value="animated" className="h-full m-0">
                <div className="h-full overflow-y-auto bg-gradient-to-br from-background to-muted/20">
                  <div className="p-6">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 h-full">
                      <div className="space-y-6">
                        <div className="bg-card rounded-lg p-6 shadow-sm border">
                          <h3 className="text-lg font-semibold mb-4">Design Controls</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium mb-2 block">Theme</label>
                              <select 
                                value={config.selectedTheme} 
                                onChange={(e) => setConfig(prev => ({ ...prev, selectedTheme: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="gold">Luxury Gold</option>
                                <option value="ocean">Ocean Blue</option>
                                <option value="sunset">Sunset Glow</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">Device Preview</label>
                              <select 
                                value={config.activeDevice} 
                                onChange={(e) => setConfig(prev => ({ ...prev, activeDevice: e.target.value }))}
                                className="w-full p-2 border rounded-md"
                              >
                                <option value="iphone14">iPhone 14</option>
                                <option value="galaxyS23">Galaxy S23</option>
                                <option value="tablet">iPad Air</option>
                                <option value="desktop">Desktop</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center">
                        <OptimizedAnimatedPreview
                          title={config.title || "Your Amazing Title"}
                          subtitle={config.subtitle || "Compelling subtitle goes here"}
                          logoUrl={config.logoUrl}
                          bgImageUrl={config.bgImageUrl}
                          bgVideoUrl={config.bgVideoUrl}
                          checklist={config.checklist.length ? config.checklist : ["Feature 1", "Feature 2", "Feature 3"]}
                          buttons={config.buttons.length ? config.buttons : [{ text: "Get Started", type: "primary", style: "filled" }]}
                          selectedTheme={config.selectedTheme}
                          activeDevice={config.activeDevice}
                          dragMode={true}
                          elementPositions={[
                            { id: 'logo', type: 'logo', x: 50, y: 15 },
                            { id: 'title', type: 'title', x: 50, y: 30 },
                            { id: 'subtitle', type: 'subtitle', x: 50, y: 40 },
                            { id: 'checklist', type: 'checklist', x: 50, y: 55 },
                            { id: 'buttons', type: 'buttons', x: 50, y: 75 }
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="preview" className="h-full m-0">
                <div className="h-full overflow-y-auto bg-gradient-to-br from-background to-muted/20">
                  <div className="flex items-center justify-center min-h-full p-8">
                    <OptimizedAnimatedPreview
                      title={config.title || "Your Amazing Title"}
                      subtitle={config.subtitle || "Compelling subtitle goes here"}
                      logoUrl={config.logoUrl}
                      bgImageUrl={config.bgImageUrl}
                      bgVideoUrl={config.bgVideoUrl}
                      checklist={config.checklist.length ? config.checklist : ["Feature 1", "Feature 2", "Feature 3"]}
                      buttons={config.buttons.length ? config.buttons : [{ text: "Get Started", type: "primary", style: "filled" }]}
                      selectedTheme={config.selectedTheme}
                      activeDevice={config.activeDevice}
                      dragMode={false}
                      fullscreenPreview={true}
                      elementPositions={[
                        { id: 'logo', type: 'logo', x: 50, y: 15 },
                        { id: 'title', type: 'title', x: 50, y: 30 },
                        { id: 'subtitle', type: 'subtitle', x: 50, y: 40 },
                        { id: 'checklist', type: 'checklist', x: 50, y: 55 },
                        { id: 'buttons', type: 'buttons', x: 50, y: 75 }
                      ]}
                    />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export types for compatibility
export type CoverButtonType = 'delivery_app' | 'checkout' | 'url';
export interface CoverButtonConfig {
  text: string;
  type: CoverButtonType;
  app_slug?: string;
  openCart?: boolean;
  url?: string;
  bg_color?: string;
  text_color?: string;
  affiliate_code?: string;
  free_shipping?: boolean;
  markup_percent?: number;
  prefill_enabled?: boolean;
  prefill_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    instructions?: string;
  };
  offset_y?: number;
  spacing_below?: number;
  style: 'filled' | 'outline';
}

export interface CoverPageConfig {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  logo_url?: string;
  logo_height?: number;
  bg_image_url?: string;
  bg_video_url?: string;
  checklist: string[];
  buttons: CoverButtonConfig[];
  is_active: boolean;
  affiliate_id?: string;
  affiliate_slug?: string;
  theme?: string;
  styles?: any;
  is_default_homepage?: boolean;
  flow_name?: string;
  is_multi_flow?: boolean;
}