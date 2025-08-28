import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Gift, Search, Save, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CoverPage {
  id: string;
  title: string;
  slug: string;
  affiliate_slug?: string;
  free_shipping_enabled: boolean;
  is_active: boolean;
}

export const FreeShippingManager = () => {
  const [coverPages, setCoverPages] = useState<CoverPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  const loadCoverPages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cover_pages')
        .select('id, title, slug, affiliate_slug, free_shipping_enabled, is_active')
        .order('title');

      if (error) {
        throw error;
      }

      setCoverPages(data || []);
    } catch (error) {
      console.error('Error loading cover pages:', error);
      toast({
        title: "Error",
        description: "Failed to load cover pages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleFreeShipping = async (pageId: string, enabled: boolean) => {
    setSaving(pageId);
    try {
      const { error } = await supabase
        .from('cover_pages')
        .update({ free_shipping_enabled: enabled })
        .eq('id', pageId);

      if (error) {
        throw error;
      }

      // Update local state
      setCoverPages(prev => 
        prev.map(page => 
          page.id === pageId 
            ? { ...page, free_shipping_enabled: enabled }
            : page
        )
      );

      toast({
        title: "Success",
        description: `Free shipping ${enabled ? 'enabled' : 'disabled'} for cover page`,
      });
    } catch (error) {
      console.error('Error updating cover page:', error);
      toast({
        title: "Error",
        description: "Failed to update free shipping setting",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const filteredPages = coverPages.filter(page =>
    page.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    page.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (page.affiliate_slug && page.affiliate_slug.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    loadCoverPages();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Free Shipping Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Free Shipping Manager
        </CardTitle>
        <CardDescription>
          Control which cover pages automatically apply free shipping to users. 
          When enabled, users coming from these cover pages will get free delivery.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert>
          <Gift className="w-4 h-4" />
          <AlertDescription>
            <strong>How it works:</strong> When a cover page has free shipping enabled, 
            all users who visit delivery apps through that cover page will automatically 
            get free shipping (delivery fee waived) for their orders.
          </AlertDescription>
        </Alert>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cover pages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Cover Pages List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredPages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? 'No cover pages match your search' : 'No cover pages found'}
            </div>
          ) : (
            filteredPages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{page.title}</h4>
                    {!page.is_active && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                    {page.free_shipping_enabled && (
                      <Badge variant="default" className="text-xs bg-green-500">
                        Free Shipping
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Slug: /{page.slug}</p>
                    {page.affiliate_slug && (
                      <p>Affiliate: {page.affiliate_slug}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Label htmlFor={`free-shipping-${page.id}`} className="text-xs">
                    Free Shipping
                  </Label>
                  <Switch
                    id={`free-shipping-${page.id}`}
                    checked={page.free_shipping_enabled}
                    onCheckedChange={(enabled) => toggleFreeShipping(page.id, enabled)}
                    disabled={saving === page.id}
                  />
                  {saving === page.id && (
                    <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {coverPages.filter(p => p.free_shipping_enabled).length}
              </p>
              <p className="text-xs text-muted-foreground">Free Shipping Enabled</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {coverPages.filter(p => p.is_active).length}
              </p>
              <p className="text-xs text-muted-foreground">Active Cover Pages</p>
            </div>
          </div>
        </div>

        <Button 
          onClick={loadCoverPages} 
          variant="outline" 
          className="w-full"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
};