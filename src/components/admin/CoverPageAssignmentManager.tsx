import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Trash2, ExternalLink, Eye } from 'lucide-react';
import { CoverPageAssignmentViewer } from '@/components/cover-page/CoverPageAssignmentViewer';

export const CoverPageAssignmentManager: React.FC = () => {
  const [coverPages, setCoverPages] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [selectedCoverPage, setSelectedCoverPage] = useState('');
  const [selectedAffiliate, setSelectedAffiliate] = useState('');
  const [shareSlug, setShareSlug] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load cover pages
      const { data: pages, error: pagesError } = await supabase
        .from('cover_pages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (pagesError) throw pagesError;
      
      // Load affiliates
      const { data: affiliateData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (affiliatesError) throw affiliatesError;
      
      // Load assignments
      const { data: assignmentData, error: assignmentsError } = await supabase
        .from('cover_page_affiliate_assignments')
        .select(`
          *,
          cover_pages (*),
          affiliates (*)
        `)
        .order('created_at', { ascending: false });
      
      if (assignmentsError) throw assignmentsError;
      
      setCoverPages(pages || []);
      setAffiliates(affiliateData || []);
      setAssignments(assignmentData || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!selectedCoverPage || !selectedAffiliate || !shareSlug) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setSaving(true);
      
      // Check if share slug already exists
      const { data: existing } = await supabase
        .from('cover_page_affiliate_assignments')
        .select('id')
        .eq('share_slug', shareSlug)
        .single();
      
      if (existing) {
        toast.error('Share slug already exists');
        return;
      }
      
      const { error } = await supabase
        .from('cover_page_affiliate_assignments')
        .insert({
          cover_page_id: selectedCoverPage,
          affiliate_id: selectedAffiliate,
          share_slug: shareSlug
        });
      
      if (error) throw error;
      
      toast.success('Assignment created successfully!');
      
      // Reset form
      setSelectedCoverPage('');
      setSelectedAffiliate('');
      setShareSlug('');
      
      // Reload data
      await loadData();
      
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('cover_page_affiliate_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      toast.success('Assignment deleted successfully!');
      await loadData();
      
    } catch (error) {
      console.error('Error deleting assignment:', error);
      toast.error('Failed to delete assignment');
    }
  };

  const getButtonSummary = (buttons: any[]) => {
    if (!buttons || !Array.isArray(buttons)) return 'No buttons';
    
    const deliveryAppButtons = buttons.filter(b => b.type === 'delivery_app');
    const otherButtons = buttons.filter(b => b.type !== 'delivery_app');
    
    let summary = '';
    if (deliveryAppButtons.length > 0) {
      summary += `${deliveryAppButtons.length} delivery app${deliveryAppButtons.length > 1 ? 's' : ''}`;
    }
    if (otherButtons.length > 0) {
      if (summary) summary += ', ';
      summary += `${otherButtons.length} other`;
    }
    
    return summary || 'No buttons';
  };

  if (loading) {
    return <div className="p-4">Loading cover page assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cover Page Assignment Manager</CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign cover pages to specific URLs and affiliate codes. Use the drag & drop editor to create beautiful cover pages with multiple call-to-action buttons.
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assign">Create Assignment</TabsTrigger>
          <TabsTrigger value="view">View Assignments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CoverPageAssignmentViewer />
        </TabsContent>

        <TabsContent value="assign" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Assignment</CardTitle>
              <p className="text-sm text-muted-foreground">
                Link a cover page to a specific affiliate and create a custom URL slug.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="coverPage">Cover Page</Label>
                  <Select value={selectedCoverPage} onValueChange={setSelectedCoverPage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cover page" />
                    </SelectTrigger>
                    <SelectContent>
                      {coverPages.map((page) => (
                        <SelectItem key={page.id} value={page.id}>
                          {page.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliate">Affiliate</Label>
                  <Select value={selectedAffiliate} onValueChange={setSelectedAffiliate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select affiliate" />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliates.map((affiliate) => (
                        <SelectItem key={affiliate.id} value={affiliate.id}>
                          {affiliate.name} ({affiliate.affiliate_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shareSlug">Share Slug</Label>
                  <Input
                    id="shareSlug"
                    value={shareSlug}
                    onChange={(e) => setShareSlug(e.target.value)}
                    placeholder="e.g., bachelor-party"
                  />
                  {shareSlug && (
                    <p className="text-xs text-muted-foreground">
                      URL: /{shareSlug}
                    </p>
                  )}
                </div>
              </div>

              <Button 
                onClick={handleCreateAssignment}
                disabled={saving || !selectedCoverPage || !selectedAffiliate || !shareSlug}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {saving ? 'Creating...' : 'Create Assignment'}
              </Button>
            </CardContent>
          </Card>

          {selectedCoverPage && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Selected Cover Page</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const page = coverPages.find(p => p.id === selectedCoverPage);
                  if (!page) return null;
                  
                  return (
                    <div className="space-y-2">
                      <h3 className="font-semibold">{page.title}</h3>
                      {page.subtitle && (
                        <p className="text-sm text-muted-foreground">{page.subtitle}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{getButtonSummary(page.buttons)}</Badge>
                        <Badge variant="secondary">Slug: {page.slug}</Badge>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => window.open(`/${page.slug}`, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Preview
                      </Button>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="view" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Assignments ({assignments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No assignments created yet.</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      // Switch to assign tab
                      const tabsList = document.querySelector('[role="tablist"]');
                      const assignTab = tabsList?.querySelector('[value="assign"]') as HTMLElement;
                      assignTab?.click();
                    }}
                  >
                    Create First Assignment
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <Card key={assignment.id} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">
                                {assignment.cover_pages?.title || 'Unknown Cover Page'}
                              </h3>
                              <Badge variant="outline">
                                /{assignment.share_slug}
                              </Badge>
                            </div>
                            
                            <div className="space-y-1 text-sm">
                              <div>
                                <strong>Affiliate:</strong> {assignment.affiliates?.name || 'Unknown'} 
                                ({assignment.affiliates?.affiliate_code || 'No code'})
                              </div>
                              <div>
                                <strong>Cover Page:</strong> {assignment.cover_pages?.slug || 'Unknown'}
                              </div>
                              {assignment.cover_pages?.buttons && (
                                <div>
                                  <strong>Buttons:</strong> {getButtonSummary(assignment.cover_pages.buttons)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(`/${assignment.share_slug}`, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};