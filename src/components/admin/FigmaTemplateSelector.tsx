import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Sparkles, 
  Download, 
  Eye, 
  Palette,
  Layout,
  Type,
  Wand2
} from 'lucide-react';

interface FigmaTemplate {
  id: string;
  template_name: string;
  template_category: string;
  design_data: any;
  preview_image_url?: string;
  created_at: string;
}

interface FigmaTemplateSelectorProps {
  onTemplateSelect: (templateData: any) => void;
}

export const FigmaTemplateSelector: React.FC<FigmaTemplateSelectorProps> = ({ 
  onTemplateSelect 
}) => {
  const [templates, setTemplates] = useState<FigmaTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('figma_design_templates')
        .select('*')
        .eq('template_category', 'cover_page')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error: any) {
      console.error('Error loading templates:', error);
      toast({ 
        title: 'Failed to load templates', 
        description: error?.message || 'Unknown error occurred',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (template: FigmaTemplate) => {
    try {
      setSelectedTemplate(template.id);
      
      // Load the full template data
      const { data, error } = await supabase
        .rpc('load_figma_template', { template_id: template.id });

      if (error) throw error;
      
      const templateData = data as any;
      
      if (templateData?.error) {
        throw new Error(templateData.error);
      }

      onTemplateSelect(templateData);
      toast({ 
        title: 'Template loaded!', 
        description: `Applied "${template.template_name}" design` 
      });
      
    } catch (error: any) {
      console.error('Error loading template:', error);
      toast({ 
        title: 'Failed to load template', 
        description: error?.message || 'Unknown error occurred',
        variant: 'destructive' 
      });
    } finally {
      setSelectedTemplate(null);
    }
  };

  const getThemePreview = (templateData: any) => {
    if (!templateData?.theme) return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    return templateData.theme.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  };

  const getLayoutType = (templateData: any) => {
    return templateData?.layout || 'centered';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-sm text-muted-foreground">Loading Figma templates...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8">
        <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground mb-2">No Figma templates available</p>
        <p className="text-xs text-muted-foreground">
          Upload your Figma designs to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Figma Design Templates</h3>
        <Badge variant="secondary" className="text-xs">
          {templates.length} available
        </Badge>
      </div>
      
      <ScrollArea className="h-80">
        <div className="space-y-3">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedTemplate === template.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Template Preview */}
                  <div className="flex-shrink-0">
                    <div 
                      className="w-16 h-12 rounded border"
                      style={{ 
                        background: getThemePreview(template.design_data),
                        backgroundSize: 'cover'
                      }}
                    >
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-white text-xs opacity-80">
                          {getLayoutType(template.design_data) === 'centered' ? '⋯' : '⌐'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-sm truncate">
                          {template.template_name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Layout className="w-3 h-3 mr-1" />
                            {getLayoutType(template.design_data)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Palette className="w-3 h-3 mr-1" />
                            {template.design_data?.theme?.primaryColor ? 'Custom' : 'Default'}
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleTemplateSelect(template)}
                        disabled={selectedTemplate === template.id}
                        className="flex-shrink-0"
                      >
                        {selectedTemplate === template.id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-white mr-1"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <Download className="w-3 h-3 mr-1" />
                            Apply
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Template Elements Preview */}
                    <div className="mt-2 text-xs text-muted-foreground">
                      {template.design_data?.elements && (
                        <div className="flex items-center gap-2">
                          <Type className="w-3 h-3" />
                          <span>
                            {template.design_data.elements.filter((e: any) => e.type === 'text').length} text elements,{' '}
                            {template.design_data.elements.filter((e: any) => e.type === 'button').length} buttons,{' '}
                            {template.design_data.elements.filter((e: any) => e.type === 'list').length} lists
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-2">
          <Wand2 className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="text-xs text-blue-800">
            <p className="font-medium mb-1">How it works:</p>
            <p>Select a template to instantly apply its design, layout, and content. You can then customize text, colors, and positioning using the other tabs.</p>
          </div>
        </div>
      </div>
    </div>
  );
};