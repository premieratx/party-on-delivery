import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buildCoverPageUrl } from '@/utils/links';
import { 
  Layout, 
  Plus, 
  Monitor, 
  Smartphone, 
  Eye, 
  Settings,
  Download,
  Upload,
  Edit,
  Trash2,
  Copy,
  ExternalLink
} from 'lucide-react';
import { UnifiedCoverPageEditor, type CoverPageConfig, type CoverButtonConfig } from '@/components/admin/UnifiedCoverPageEditor';

import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CoverPageProject {
  id: string;
  name: string;
  createdAt: string;
  lastModified: string;
  devices: string[];
  status: 'draft' | 'published';
}

export default function CoverPagesAdmin() {
  const [showCreator, setShowCreator] = useState(false);
  console.log('🔍 CoverPagesAdmin render - showCreator:', showCreator);
  const [editingPage, setEditingPage] = useState<CoverPageConfig | null>(null);
  const [coverPages, setCoverPages] = useState<CoverPageConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<CoverPageProject[]>([]);

  // Load cover pages from database
  useEffect(() => {
    loadCoverPages();
  }, []);

  const loadCoverPages = async () => {
    try {
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Convert database JSON types to proper types
      const convertedData: CoverPageConfig[] = (data || []).map(page => ({
        id: page.id,
        slug: page.slug,
        title: page.title,
        subtitle: page.subtitle || undefined,
        logo_url: page.logo_url || undefined,
        logo_height: page.logo_height || undefined,
        bg_image_url: page.bg_image_url || undefined,
        bg_video_url: page.bg_video_url || undefined,
        checklist: Array.isArray(page.checklist) ? page.checklist.filter(item => typeof item === 'string') : [],
        buttons: Array.isArray(page.buttons) ? (page.buttons as unknown as CoverButtonConfig[]) : [],
        is_active: page.is_active,
        affiliate_id: page.affiliate_id || undefined,
        affiliate_slug: page.affiliate_slug || undefined,
        styles: typeof page.styles === 'object' && page.styles ? page.styles as any : undefined,
        is_default_homepage: page.is_default_homepage || false,
        flow_name: page.flow_name || undefined,
        is_multi_flow: page.is_multi_flow || false
      }));
      
      setCoverPages(convertedData);
      
      // Convert to projects format for display
      const projectData: CoverPageProject[] = convertedData.map(page => ({
        id: page.id!,
        name: page.title,
        createdAt: new Date(data?.find(p => p.id === page.id)?.created_at || Date.now()).toLocaleDateString(),
        lastModified: new Date(data?.find(p => p.id === page.id)?.updated_at || Date.now()).toLocaleDateString(),
        devices: ['Desktop', 'iPhone 14 Pro', 'Galaxy S23', 'Pixel 7'], // All devices supported
        status: page.is_active ? 'published' : 'draft'
      }));
      setProjects(projectData);
    } catch (error) {
      console.error('Error loading cover pages:', error);
      toast.error('Failed to load cover pages');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    toast.success('Cover page saved successfully!');
    await loadCoverPages(); // Reload the list
    setShowCreator(false);
    setEditingPage(null);
  };

  const exportProject = (projectId: string) => {
    // In a real implementation, this would export the project
    toast.info('Exporting project...');
  };

  const handleEditProject = (projectId: string) => {
    const coverPage = coverPages.find(p => p.id === projectId);
    if (coverPage) {
      setEditingPage(coverPage);
      setShowCreator(true);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this cover page?')) return;

    try {
      const { error } = await supabase
        .from('cover_pages')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      
      toast.success('Cover page deleted successfully');
      await loadCoverPages();
    } catch (error) {
      console.error('Error deleting cover page:', error);
      toast.error('Failed to delete cover page');
    }
  };

  const copyCoverUrl = async (projectId: string) => {
    const coverPage = coverPages.find(p => p.id === projectId);
    if (coverPage) {
      const url = buildCoverPageUrl(coverPage.slug);
      try {
        await navigator.clipboard.writeText(url);
        toast.success(`Copied URL for ${coverPage.title}`);
      } catch (error) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        toast.success(`Copied URL for ${coverPage.title}`);
      }
    }
  };

  const openCoverUrl = (projectId: string) => {
    const coverPage = coverPages.find(p => p.id === projectId);
    if (coverPage) {
      window.open(buildCoverPageUrl(coverPage.slug), '_blank');
    }
  };

  const duplicateProject = async (projectId: string) => {
    const coverPage = coverPages.find(p => p.id === projectId);
    if (coverPage) {
      try {
        const duplicateData = {
          slug: `${coverPage.slug}-copy-${Date.now()}`,
          title: `${coverPage.title} (Copy)`,
          subtitle: coverPage.subtitle,
          logo_url: coverPage.logo_url,
          logo_height: coverPage.logo_height,
          bg_image_url: coverPage.bg_image_url,
          bg_video_url: coverPage.bg_video_url,
          checklist: coverPage.checklist as any,
          buttons: coverPage.buttons as any,
          is_active: false, // Start as draft
          is_default_homepage: false, // Don't copy homepage status
          affiliate_id: coverPage.affiliate_id,
          affiliate_slug: coverPage.affiliate_slug,
          styles: coverPage.styles as any,
          flow_name: coverPage.flow_name,
          is_multi_flow: coverPage.is_multi_flow
        };
        
        const { error } = await supabase
          .from('cover_pages')
          .insert(duplicateData as any);

        if (error) throw error;
        
        toast.success('Project duplicated');
        await loadCoverPages();
      } catch (error) {
        console.error('Error duplicating cover page:', error);
        toast.error('Failed to duplicate cover page');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <Layout className="h-6 w-6" />
                  Cover Page Creator
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Create responsive cover pages for desktop and mobile devices with templates and custom designs
                </p>
              </div>
              <Button 
                onClick={() => {
                  console.log('🔴 NEW COVER PAGE BUTTON CLICKED - opening editor');
                  setShowCreator(true);
                }}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Cover Page
              </Button>
            </div>
          </CardHeader>
        </Card>


        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Monitor className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Multi-Device Support</h3>
                  <p className="text-sm text-muted-foreground">Desktop + 3 popular mobile devices</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Upload className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">Media Upload</h3>
                  <p className="text-sm text-muted-foreground">Upload images, videos, and logos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Settings className="w-8 h-8 text-primary" />
                <div>
                  <h3 className="font-semibold">10+ Templates</h3>
                  <p className="text-sm text-muted-foreground">Pre-designed templates for quick start</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Cover Page Projects</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading cover pages...</p>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <Layout className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No cover pages yet</h3>
                <p className="text-muted-foreground mb-4">Create your first cover page to get started</p>
                <Button onClick={() => {
                  console.log('🔴 CREATE FIRST COVER PAGE BUTTON CLICKED - opening editor');
                  setShowCreator(true);
                }}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Cover Page
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border rounded-lg p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{project.name}</h3>
                          <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-2">
                          <p className="text-sm font-mono bg-muted px-2 py-1 rounded text-primary">
                            {buildCoverPageUrl(coverPages.find(p => p.id === project.id)?.slug || '')}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCoverUrl(project.id)}
                            className="h-5 w-5 p-0"
                            title="Copy URL"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openCoverUrl(project.id)}
                            className="h-5 w-5 p-0"
                            title="Open in new tab"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Created: {project.createdAt}</span>
                          <span>Modified: {project.lastModified}</span>
                          <div className="flex items-center gap-1">
                            <span>Devices:</span>
                            {project.devices.slice(0, 2).map((device, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {device}
                              </Badge>
                            ))}
                            {project.devices.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{project.devices.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openCoverUrl(project.id)}
                          title="Open Live URL"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditProject(project.id)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => duplicateProject(project.id)}
                          title="Duplicate"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteProject(project.id)}
                          title="Delete"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Device Support Info */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Supported Devices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Monitor className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">Desktop</p>
                  <p className="text-sm text-muted-foreground">1200x800</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Smartphone className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">iPhone 14 Pro</p>
                  <p className="text-sm text-muted-foreground">393x852</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Smartphone className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">Galaxy S23</p>
                  <p className="text-sm text-muted-foreground">360x780</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <Smartphone className="w-6 h-6 text-primary" />
                <div>
                  <p className="font-semibold">Pixel 7</p>
                  <p className="text-sm text-muted-foreground">412x915</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Cover Page Editor Modal */}
      <UnifiedCoverPageEditor
        open={showCreator}
        onOpenChange={(open) => {
          setShowCreator(open);
          if (!open) {
            setEditingPage(null);
          }
        }}
        initial={editingPage}
        onSaved={handleSaveProject}
      />
    </div>
  );
}