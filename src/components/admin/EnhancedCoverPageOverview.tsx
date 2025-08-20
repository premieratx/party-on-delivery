import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Copy, 
  Trash2, 
  Play, 
  Pause, 
  Star,
  Calendar,
  Activity,
  TrendingUp,
  Users
} from 'lucide-react';

interface CoverPage {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  is_active: boolean;
  is_default_homepage: boolean;
  created_at: string;
  updated_at: string;
  view_count?: number;
  conversion_rate?: number;
  styles?: any;
}

interface CoverPageOverviewProps {
  onEditPage: (page: CoverPage) => void;
  onCreateNew: () => void;
}

export const EnhancedCoverPageOverview: React.FC<CoverPageOverviewProps> = ({
  onEditPage,
  onCreateNew
}) => {
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'updated' | 'views' | 'conversion'>('updated');

  // Load cover pages with analytics
  const loadCoverPages = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cover_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Add mock analytics data (replace with real analytics later)
      const pagesWithAnalytics = (data || []).map(page => ({
        ...page,
        view_count: Math.floor(Math.random() * 1000) + 100,
        conversion_rate: parseFloat((Math.random() * 10 + 1).toFixed(1))
      }));
      
      setCoverPages(pagesWithAnalytics);
    } catch (error) {
      console.error('Error loading cover pages:', error);
      toast.error('Failed to load cover pages');
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and sort pages
  const filteredPages = React.useMemo(() => {
    let filtered = coverPages.filter(page => {
      const matchesSearch = page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           page.slug.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && page.is_active) ||
                           (statusFilter === 'inactive' && !page.is_active);
      return matchesSearch && matchesStatus;
    });

    // Sort pages
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'views':
          return (b.view_count || 0) - (a.view_count || 0);
        case 'conversion':
          return (b.conversion_rate || 0) - (a.conversion_rate || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [coverPages, searchTerm, statusFilter, sortBy]);

  // Page actions
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

  const handleDuplicatePage = useCallback(async (page: CoverPage) => {
    try {
      const { error } = await supabase
        .from('cover_pages')
        .insert({
          title: `${page.title} (Copy)`,
          subtitle: page.subtitle,
          slug: `${page.slug}-copy-${Date.now()}`,
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

  // Summary stats
  const stats = React.useMemo(() => ({
    total: coverPages.length,
    active: coverPages.filter(p => p.is_active).length,
    totalViews: coverPages.reduce((sum, p) => sum + (p.view_count || 0), 0),
    avgConversion: coverPages.length > 0 
      ? (coverPages.reduce((sum, p) => sum + (p.conversion_rate || 0), 0) / coverPages.length).toFixed(1)
      : '0.0'
  }), [coverPages]);

  useEffect(() => {
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
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pages</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Pages</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="animate-fade-in">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Conversion</p>
                <p className="text-2xl font-bold">{stats.avgConversion}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Cover Pages</CardTitle>
            <Button onClick={onCreateNew} className="animate-scale-in">
              <Star className="h-4 w-4 mr-2" />
              Create New Page
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search pages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated">Last Updated</SelectItem>
                <SelectItem value="created">Date Created</SelectItem>
                <SelectItem value="views">Most Views</SelectItem>
                <SelectItem value="conversion">Best Conversion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Pages List */}
          <div className="space-y-4">
            {filteredPages.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No cover pages found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filters' 
                    : 'Create your first cover page to get started'
                  }
                </p>
                {!searchTerm && statusFilter === 'all' && (
                  <Button onClick={onCreateNew}>
                    <Star className="h-4 w-4 mr-2" />
                    Create Your First Page
                  </Button>
                )}
              </div>
            ) : (
              filteredPages.map((page) => (
                <Card key={page.id} className="animate-fade-in hover-scale transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold">{page.title}</h4>
                          <Badge variant={page.is_active ? 'default' : 'secondary'}>
                            {page.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {page.is_default_homepage && (
                            <Badge variant="outline" className="border-primary text-primary">
                              <Star className="h-3 w-3 mr-1" />
                              Homepage
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-muted-foreground mb-3">{page.subtitle}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {page.view_count?.toLocaleString()} views
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {page.conversion_rate?.toFixed(1)}% conversion
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Updated {new Date(page.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mt-2">
                          URL: /{page.slug}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => window.open(`/${page.slug}`, '_blank')}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onEditPage(page)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleDuplicatePage(page)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={page.is_active ? 'secondary' : 'default'}
                          onClick={() => handleToggleActive(page.id, page.is_active)}
                        >
                          {page.is_active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDeletePage(page.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};