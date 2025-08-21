import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Book, Code, Palette, Layout, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Guideline {
  id: string;
  guideline_type: string;
  component_name?: string;
  title: string;
  description?: string;
  rules: string[];
  examples: any;
  priority: number;
}

interface GuidelinesViewerProps {
  className?: string;
}

const typeIcons = {
  general: Code,
  design_system: Palette,
  component: Layout,
};

const typeColors = {
  general: 'bg-blue-500/10 text-blue-700 border-blue-200',
  design_system: 'bg-purple-500/10 text-purple-700 border-purple-200',
  component: 'bg-green-500/10 text-green-700 border-green-200',
};

export const GuidelinesViewer: React.FC<GuidelinesViewerProps> = ({ className = '' }) => {
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    const loadGuidelines = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('system_guidelines')
          .select('*')
          .eq('is_active', true)
          .order('priority', { ascending: false })
          .order('title');

        if (error) throw error;
        setGuidelines((data || []).map(item => ({
          ...item,
          rules: Array.isArray(item.rules) ? item.rules.map(r => String(r)) : [],
          examples: Array.isArray(item.examples) ? item.examples : []
        })));
      } catch (error) {
        console.error('Error loading guidelines:', error);
      } finally {
        setLoading(false);
      }
    };

    loadGuidelines();
  }, []);

  const filteredGuidelines = selectedType === 'all' 
    ? guidelines 
    : guidelines.filter(g => g.guideline_type === selectedType);

  const guidelineTypes = [...new Set(guidelines.map(g => g.guideline_type))];

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2 mb-6">
        <Book className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-bold">System Design Guidelines</h2>
        <Badge variant="secondary">{guidelines.length} Guidelines</Badge>
      </div>

      <Tabs value={selectedType} onValueChange={setSelectedType}>
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="design_system">Design</TabsTrigger>
          <TabsTrigger value="component">Components</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedType} className="mt-6">
          <ScrollArea className="h-[70vh]">
            <div className="space-y-6">
              {filteredGuidelines.map((guideline) => {
                const IconComponent = typeIcons[guideline.guideline_type as keyof typeof typeIcons];
                const colorClass = typeColors[guideline.guideline_type as keyof typeof typeColors];
                
                return (
                  <Card key={guideline.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <IconComponent className="h-5 w-5 text-primary" />
                          <div>
                            <CardTitle className="text-lg">{guideline.title}</CardTitle>
                            {guideline.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {guideline.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge className={colorClass} variant="outline">
                          {guideline.guideline_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Rules */}
                      <div>
                        <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                          Guidelines
                        </h4>
                        <div className="space-y-2">
                          {guideline.rules.map((rule, index) => (
                            <div key={index} className="flex gap-2 items-start">
                              <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <p className="text-sm leading-relaxed">{rule}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Examples */}
                      {guideline.examples && Object.keys(guideline.examples).length > 0 && (
                        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                          <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                            Examples
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(guideline.examples).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium text-primary">{key}:</span>
                                <span className="ml-2 text-muted-foreground">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
              
              {filteredGuidelines.length === 0 && (
                <div className="text-center py-12">
                  <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No guidelines found for the selected type.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};