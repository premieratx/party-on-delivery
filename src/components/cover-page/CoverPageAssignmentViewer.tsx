import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Eye, ExternalLink, Settings } from 'lucide-react';

export const CoverPageAssignmentViewer: React.FC = () => {
  const [coverPages, setCoverPages] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewPage, setPreviewPage] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load cover pages
      const { data: pages } = await supabase
        .from('cover_pages')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Load assignments
      const { data: pageAssignments } = await supabase
        .from('cover_page_affiliate_assignments')
        .select(`
          *,
          cover_pages (*),
          affiliates (*)
        `);

      setCoverPages(pages || []);
      setAssignments(pageAssignments || []);
    } catch (error) {
      console.error('Error loading cover page data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentsForPage = (pageId: string) => {
    return assignments.filter(a => a.cover_page_id === pageId);
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

  const isDefaultForMainApp = (coverPage: any) => {
    return coverPage.buttons && 
           Array.isArray(coverPage.buttons) && 
           coverPage.buttons.length >= 2 &&
           coverPage.buttons.some((btn: any) => btn.type === 'delivery_app');
  };

  if (loading) {
    return <div className="p-4">Loading cover page assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cover Page System Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{coverPages.length}</div>
                <div className="text-sm text-muted-foreground">Active Cover Pages</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{assignments.length}</div>
                <div className="text-sm text-muted-foreground">Active Assignments</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {coverPages.filter(isDefaultForMainApp).length}
                </div>
                <div className="text-sm text-muted-foreground">Multi-Button Pages</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cover Pages & Their Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {coverPages.map((page) => {
              const pageAssignments = getAssignmentsForPage(page.id);
              const isDefault = isDefaultForMainApp(page);
              
              return (
                <Card key={page.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{page.title}</h3>
                          {isDefault && (
                            <Badge variant="default">Default for Main App</Badge>
                          )}
                          <Badge variant="outline">
                            {getButtonSummary(page.buttons)}
                          </Badge>
                        </div>
                        
                        {page.subtitle && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {page.subtitle}
                          </p>
                        )}
                        
                        <div className="text-sm">
                          <strong>Slug:</strong> {page.slug}
                        </div>
                        
                        {page.buttons && Array.isArray(page.buttons) && (
                          <div className="mt-2">
                            <strong className="text-sm">Buttons:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {page.buttons.map((btn: any, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {btn.text} → {btn.app_slug || btn.url || 'No target'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {pageAssignments.length > 0 && (
                          <div className="mt-2">
                            <strong className="text-sm">Assignments:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {pageAssignments.map((assignment, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {assignment.share_slug} 
                                  {assignment.affiliates?.affiliate_code && 
                                    ` (${assignment.affiliates.affiliate_code})`
                                  }
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewPage(page)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(`/${page.slug}`, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Cover pages are now disabled - no preview modal */}
      {previewPage && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">Cover pages have been disabled to fix loading issues</p>
          <Button onClick={() => setPreviewPage(null)} variant="outline" size="sm" className="mt-2">
            Close
          </Button>
        </div>
      )}
    </div>
  );
};