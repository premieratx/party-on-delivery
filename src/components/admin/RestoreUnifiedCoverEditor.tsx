import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UnifiedCoverPageEditor } from "./UnifiedCoverPageEditor";
import { AnimatedCoverPreview } from "./AnimatedCoverPreview";
import { FigmaTemplateSelector } from "./FigmaTemplateSelector";
import { Wand2, Layout, Sparkles, Eye } from 'lucide-react';

interface RestoreUnifiedCoverEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

export const RestoreUnifiedCoverEditor: React.FC<RestoreUnifiedCoverEditorProps> = ({
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
        description: "Figma template has been applied to your cover page"
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden" aria-describedby="restore-dialog-description">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Unified Cover Page Editor
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="unified" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Drag & Drop
            </TabsTrigger>
            <TabsTrigger value="figma" className="flex items-center gap-2">
              <Wand2 className="w-4 h-4" />
              Figma Templates
            </TabsTrigger>
            <TabsTrigger value="animated" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Animation
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Live Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unified" className="h-full mt-4">
            <div className="h-full">
              <FigmaTemplateSelector onTemplateSelect={handleFigmaTemplateSelect} />
            </div>
          </TabsContent>

          <TabsContent value="figma" className="h-full mt-4">
            <div className="h-full overflow-y-auto">
              <FigmaTemplateSelector onTemplateSelect={handleFigmaTemplateSelect} />
            </div>
          </TabsContent>

          <TabsContent value="animated" className="h-full mt-4">
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                  <AnimatedCoverPreview
                    title={config.title}
                    subtitle={config.subtitle}
                    logoUrl={config.logoUrl}
                    bgImageUrl={config.bgImageUrl}
                    bgVideoUrl={config.bgVideoUrl}
                    checklist={config.checklist}
                    buttons={config.buttons}
                    selectedTheme={config.selectedTheme}
                    activeDevice={config.activeDevice}
                    titleSize={48}
                    subtitleSize={20}
                    checklistSize={16}
                    titleOffsetY={0}
                    subtitleOffsetY={0}
                    checklistOffsetY={0}
                    buttonsOffsetY={0}
                    logoOffsetY={0}
                    logoHeight={160}
                  />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="h-full mt-4">
            <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="max-w-md w-full">
                <AnimatedCoverPreview
                  title={config.title}
                  subtitle={config.subtitle}
                  logoUrl={config.logoUrl}
                  bgImageUrl={config.bgImageUrl}
                  bgVideoUrl={config.bgVideoUrl}
                  checklist={config.checklist}
                  buttons={config.buttons}
                  selectedTheme={config.selectedTheme}
                  activeDevice={config.activeDevice}
                  titleSize={48}
                  subtitleSize={20}
                  checklistSize={16}
                  titleOffsetY={0}
                  subtitleOffsetY={0}
                  checklistOffsetY={0}
                  buttonsOffsetY={0}
                  logoOffsetY={0}
                  logoHeight={160}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};