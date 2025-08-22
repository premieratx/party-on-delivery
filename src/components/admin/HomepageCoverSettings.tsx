import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { UnifiedCoverPageEditor } from './UnifiedCoverPageEditor';
import { Settings, Eye, Plus } from 'lucide-react';
import { CANONICAL_DOMAIN } from '@/utils/domain';

interface CoverPage {
  id: string;
  title: string;
  slug: string;
  is_active: boolean;
  created_at: string;
}

interface HomepageCoverConfig {
  id: string;
  is_active: boolean;
  cover_page_id: string;
  cover_pages: CoverPage;
}

export const HomepageCoverSettings: React.FC = () => {
  const { toast } = useToast();
  const [coverConfig, setCoverConfig] = useState<HomepageCoverConfig | null>(null);
  const [availablePages, setAvailablePages] = useState<CoverPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load current homepage cover configuration
      const { data: config } = await supabase
        .from('homepage_cover_config')
        .select(`
          id,
          is_active,
          cover_page_id,
          cover_pages (
            id,
            title,
            slug,
            is_active,
            created_at
          )
        `)
        .eq('is_active', true)
        .maybeSingle();

      setCoverConfig(config);

      // Load all available cover pages
      const { data: pages } = await supabase
        .from('cover_pages')
        .select('id, title, slug, is_active, created_at')
        .order('created_at', { ascending: false });

      setAvailablePages(pages || []);
    } catch (error) {
      console.error('Error loading homepage cover data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load homepage cover configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleHomepageCover = async (enabled: boolean) => {
    setSaving(true);
    try {
      if (enabled && !coverConfig) {
        // Need to select a cover page first
        toast({
          title: 'Select Cover Page',
          description: 'Please select a cover page to use for the homepage modal',
          variant: 'destructive'
        });
        return;
      }

      if (coverConfig) {
        // Update existing configuration
        const { error } = await supabase
          .from('homepage_cover_config')
          .update({ is_active: enabled })
          .eq('id', coverConfig.id);

        if (error) throw error;

        setCoverConfig(prev => prev ? { ...prev, is_active: enabled } : null);
      }

      toast({
        title: 'Success',
        description: `Homepage cover modal ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      console.error('Error updating homepage cover:', error);
      toast({
        title: 'Error',
        description: 'Failed to update homepage cover configuration',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSelectCoverPage = async (coverPageId: string) => {
    setSaving(true);
    try {
      if (coverConfig) {
        // Update existing configuration
        const { error } = await supabase
          .from('homepage_cover_config')
          .update({ 
            cover_page_id: coverPageId,
            is_active: true 
          })
          .eq('id', coverConfig.id);

        if (error) throw error;
      } else {
        // Create new configuration
        const { data, error } = await supabase
          .from('homepage_cover_config')
          .insert({
            cover_page_id: coverPageId,
            is_active: true
          })
          .select(`
            id,
            is_active,
            cover_page_id,
            cover_pages (
              id,
              title,
              slug,
              is_active,
              created_at
            )
          `)
          .single();

        if (error) throw error;
        setCoverConfig(data);
      }

      await loadData(); // Refresh data
      toast({
        title: 'Success',
        description: 'Homepage cover page updated successfully',
      });
    } catch (error) {
      console.error('Error selecting cover page:', error);
      toast({
        title: 'Error',
        description: 'Failed to update cover page selection',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const previewHomepageCover = () => {
    if (!coverConfig?.cover_pages) return;
    window.open(`${CANONICAL_DOMAIN}/cover/${coverConfig.cover_pages.slug}`, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Homepage Cover Modal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Enable Homepage Cover Modal</Label>
              <p className="text-xs text-muted-foreground">
                Show a cover page modal when users visit the homepage without selecting an app
              </p>
            </div>
            <Switch
              checked={coverConfig?.is_active || false}
              onCheckedChange={handleToggleHomepageCover}
              disabled={saving}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Select Cover Page</Label>
            <Select
              value={coverConfig?.cover_page_id || ''}
              onValueChange={handleSelectCoverPage}
              disabled={saving}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a cover page..." />
              </SelectTrigger>
              <SelectContent>
                {availablePages.map((page) => (
                  <SelectItem key={page.id} value={page.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{page.title}</span>
                      <div className="flex gap-2 ml-4">
                        <Badge variant={page.is_active ? "default" : "secondary"} className="text-xs">
                          {page.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {coverConfig?.cover_pages && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={previewHomepageCover}
              >
                <Eye className="w-4 h-4 mr-2" />
                Preview Cover
              </Button>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEditor(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Cover Page
            </Button>
          </div>

          {coverConfig?.is_active && coverConfig.cover_pages && (
            <div className="bg-muted/50 border rounded-lg p-4">
              <div className="text-sm">
                <div className="font-semibold text-primary mb-2">Current Homepage Cover:</div>
                <div className="space-y-1">
                  <div><strong>Title:</strong> {coverConfig.cover_pages.title}</div>
                  <div><strong>Slug:</strong> /{coverConfig.cover_pages.slug}</div>
                  <div><strong>Status:</strong> 
                    <Badge variant={coverConfig.cover_pages.is_active ? "default" : "secondary"} className="ml-2">
                      {coverConfig.cover_pages.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {showEditor && (
        <UnifiedCoverPageEditor
          open={showEditor}
          onOpenChange={setShowEditor}
          onSaved={() => {
            loadData();
            setShowEditor(false);
          }}
        />
      )}
    </>
  );
};