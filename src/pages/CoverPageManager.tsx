import React, { useState, useEffect } from 'react';
import { buildCoverPageUrl } from '@/utils/links';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Eye, Trash2, Copy, ExternalLink } from 'lucide-react';
import { UnifiedCoverPageEditor } from '@/components/admin/UnifiedCoverPageEditor';

const CoverPageManager = () => {
  const [showEditor, setShowEditor] = useState(false);
  const [selectedPage, setSelectedPage] = useState<any>(null);
  const [coverPages, setCoverPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

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
      setCoverPages(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading cover pages',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedPage(null);
    setShowEditor(true);
  };

  const handleEdit = (page: any) => {
    setSelectedPage(page);
    setShowEditor(true);
  };

  const handleEditorClose = () => {
    setShowEditor(false);
    setSelectedPage(null);
    loadCoverPages();
  };

  const copyCoverUrl = async (page: any) => {
    const url = buildCoverPageUrl(page.slug);
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: 'URL Copied',
        description: `Copied URL for ${page.title}`
      });
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({
        title: 'URL Copied',
        description: `Copied URL for ${page.title}`
      });
    }
  };

  const openCoverUrl = (page: any) => {
    window.open(buildCoverPageUrl(page.slug), '_blank');
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this cover page?')) return;
    
    try {
      const { error } = await supabase
        .from('cover_pages')
        .delete()
        .eq('id', pageId);
      
      if (error) throw error;
      
      toast({
        title: 'Cover page deleted',
        description: 'The cover page has been successfully deleted.'
      });
      
      loadCoverPages();
    } catch (error: any) {
      toast({
        title: 'Error deleting cover page',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  if (showEditor) {
    return (
      <UnifiedCoverPageEditor 
        open={showEditor}
        onOpenChange={handleEditorClose}
        initial={selectedPage}
        onSaved={handleEditorClose}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Cover Page Manager</h1>
          <p className="text-muted-foreground">
            Create and manage cover pages with live preview, drag & drop editing, and Figma integration
          </p>
        </div>

        {/* Create New Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Cover Pages</h2>
          <Button onClick={handleCreateNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Create New Cover Page
          </Button>
        </div>

        {/* Cover Pages Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading cover pages...</span>
          </div>
        ) : coverPages.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No cover pages yet</h3>
                <p className="text-muted-foreground">
                  Create your first cover page with our powerful visual editor
                </p>
              </div>
              <Button onClick={handleCreateNew} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Cover Page
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coverPages.map((page) => (
              <Card key={page.id} className="overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  {page.bg_image_url ? (
                    <img 
                      src={page.bg_image_url} 
                      alt={page.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl font-bold text-muted-foreground">
                      {page.title.charAt(0)}
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold line-clamp-1">{page.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          /{page.slug}
                        </p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs ${
                        page.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {page.is_active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    
                    {page.subtitle && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {page.subtitle}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-mono bg-muted px-2 py-1 rounded text-primary">
                        https://order.partyondelivery.com/cover/{page.slug}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyCoverUrl(page)}
                        className="h-5 w-5 p-0"
                        title="Copy URL"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openCoverUrl(page)}
                        className="h-5 w-5 p-0"
                        title="Open in new tab"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEdit(page)}
                        className="flex-1 gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => openCoverUrl(page)}
                        className="gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Live
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleDelete(page.id)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Feature Highlights */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Advanced Cover Page Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Eye className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Live Preview</h4>
              <p className="text-sm text-muted-foreground">
                See changes instantly as you edit
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Edit className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Drag & Drop</h4>
              <p className="text-sm text-muted-foreground">
                Move elements around visually
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-3 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h4 className="font-semibold">Figma Integration</h4>
              <p className="text-sm text-muted-foreground">
                Import your Figma designs
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverPageManager;