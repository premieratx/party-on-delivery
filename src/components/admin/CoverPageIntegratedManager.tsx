import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Rocket, 
  Target, 
  FileText, 
  BarChart3, 
  Plus, 
  Eye, 
  Edit, 
  Trash2,
  Copy,
  Play,
  Pause,
  Settings
} from 'lucide-react';

import { EnhancedCoverPageOverview } from './EnhancedCoverPageOverview';

// Import all the optimized components
import { OptimizedCoverPageCreator } from './OptimizedCoverPageCreator';
import { CoverPageDragDropEditor } from './CoverPageDragDropEditor';
import { CoverPageTemplateLibrary } from './CoverPageTemplateLibrary';
import { CoverPagePerformanceMonitor } from './CoverPagePerformanceMonitor';

interface CoverPage {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  bg_image_url?: string;
  bg_video_url?: string;
  logo_url?: string;
  logo_height?: number;
  buttons?: any;
  checklist?: any;
  is_active: boolean;
  is_default_homepage: boolean;
  created_at: string;
  updated_at: string;
  styles: any;
}

export const CoverPageIntegratedManager: React.FC = () => {
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPage, setSelectedPage] = useState<CoverPage | null>(null);

  // Load cover pages
  const loadCoverPages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoverPages(data || []);
    } catch (error) {
      console.error('Error loading cover pages:', error);
      toast.error('Failed to load cover pages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle page actions
  const handleDeletePage = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this cover page?')) return;
    
    try {
      const { error } = await supabase
        .from('cover_pages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Cover page deleted');
      loadCoverPages();
    } catch (error) {
      console.error('Error deleting cover page:', error);
      toast.error('Failed to delete cover page');
    }
  }, [loadCoverPages]);

  const handleToggleActive = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('cover_pages')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      toast.success(`Cover page ${!currentStatus ? 'activated' : 'deactivated'}`);
      loadCoverPages();
    } catch (error) {
      console.error('Error updating cover page:', error);
      toast.error('Failed to update cover page');
    }
  }, [loadCoverPages]);

  const handleDuplicatePage = useCallback(async (page: CoverPage) => {
    try {
      const { error } = await supabase
        .from('cover_pages')
        .insert({
          title: `${page.title} (Copy)`,
          subtitle: page.subtitle,
          slug: `${page.slug}-copy-${Date.now()}`,
          bg_image_url: page.bg_image_url,
          bg_video_url: page.bg_video_url,
          logo_url: page.logo_url,
          logo_height: page.logo_height,
          buttons: page.buttons,
          checklist: page.checklist,
          styles: page.styles,
          is_active: false,
          is_default_homepage: false
        });

      if (error) throw error;
      toast.success('Cover page duplicated');
      loadCoverPages();
    } catch (error) {
      console.error('Error duplicating cover page:', error);
      toast.error('Failed to duplicate cover page');
    }
  }, [loadCoverPages]);

  // Performance metrics (mocked for now)
  const performanceMetrics = useMemo(() => ({
    totalPages: coverPages.length,
    activePages: coverPages.filter(p => p.is_active).length,
    avgLoadTime: '1.2s',
    conversionRate: '4.8%'
  }), [coverPages]);

  React.useEffect(() => {
    loadCoverPages();
  }, [loadCoverPages]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold">{performanceMetrics.totalPages}</p>
              </div>
              <FileText className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Pages</p>
                <p className="text-2xl font-bold">{performanceMetrics.activePages}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Load Time</p>
                <p className="text-2xl font-bold">{performanceMetrics.avgLoadTime}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
                <p className="text-2xl font-bold">{performanceMetrics.conversionRate}</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="optimized" className="flex items-center gap-2">
            <Rocket className="h-4 w-4" />
            Optimized Creator
          </TabsTrigger>
          <TabsTrigger value="drag-drop" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Drag & Drop
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Performance
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <EnhancedCoverPageOverview
            onEditPage={(page) => {
              setSelectedPage(page as CoverPage);
              setActiveTab('optimized');
            }}
            onCreateNew={() => setActiveTab('optimized')}
          />
        </TabsContent>

        {/* Optimized Creator Tab */}
        <TabsContent value="optimized" className="space-y-4">
          <div className="h-[calc(100vh-300px)]">
            <OptimizedCoverPageCreator />
          </div>
        </TabsContent>

        {/* Drag & Drop Tab */}
        <TabsContent value="drag-drop" className="space-y-4">
          <div className="h-[calc(100vh-300px)]">
            <CoverPageDragDropEditor />
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="h-[calc(100vh-300px)]">
            <CoverPageTemplateLibrary 
              onApplyTemplate={(template) => {
                toast.success(`Applied template: ${template.name}`);
                setActiveTab('optimized');
              }}
            />
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="h-[calc(100vh-300px)]">
            <CoverPagePerformanceMonitor />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};