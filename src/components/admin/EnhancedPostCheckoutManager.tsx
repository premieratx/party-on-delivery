import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Home, Eye } from 'lucide-react';

interface PostCheckoutPage {
  id: string;
  name: string;
  slug: string;
  content: any;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const EnhancedPostCheckoutManager: React.FC = () => {
  const [pages, setPages] = useState<PostCheckoutPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<PostCheckoutPage | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    content: {
      title: 'Order Complete!',
      message: 'Thank you for your order. We will process it shortly.',
      customHtml: '',
      redirectUrl: '',
      redirectDelay: 0
    },
    is_active: true
  });

  useEffect(() => {
    loadPages();
  }, []);

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from('post_checkout_pages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error loading post-checkout pages:', error);
      toast({
        title: "Error",
        description: "Failed to load post-checkout pages",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast({
        title: "Error",
        description: "Name and slug are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const pageData = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        content: formData.content,
        is_active: formData.is_active
      };

      if (editingPage) {
        const { error } = await supabase
          .from('post_checkout_pages')
          .update(pageData)
          .eq('id', editingPage.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Post-checkout page updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('post_checkout_pages')
          .insert([pageData]);

        if (error) throw error;

        toast({
          title: "Success", 
          description: "Post-checkout page created successfully"
        });
      }

      setIsCreateOpen(false);
      setEditingPage(null);
      resetForm();
      loadPages();
    } catch (error: any) {
      console.error('Error saving post-checkout page:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save post-checkout page",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (page: PostCheckoutPage) => {
    if (!confirm(`Are you sure you want to delete "${page.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('post_checkout_pages')
        .delete()
        .eq('id', page.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post-checkout page deleted successfully"
      });
      loadPages();
    } catch (error: any) {
      console.error('Error deleting post-checkout page:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete post-checkout page",
        variant: "destructive"
      });
    }
  };

  const handleSetDefault = async (page: PostCheckoutPage) => {
    try {
      const { error } = await supabase
        .from('post_checkout_pages')
        .update({ is_default: true })
        .eq('id', page.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `"${page.name}" is now the default post-checkout page`
      });
      loadPages();
    } catch (error: any) {
      console.error('Error setting default post-checkout page:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to set default page",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      content: {
        title: 'Order Complete!',
        message: 'Thank you for your order. We will process it shortly.',
        customHtml: '',
        redirectUrl: '',
        redirectDelay: 0
      },
      is_active: true
    });
  };

  const openEditDialog = (page: PostCheckoutPage) => {
    setEditingPage(page);
    setFormData({
      name: page.name,
      slug: page.slug,
      content: page.content,
      is_active: page.is_active
    });
    setIsCreateOpen(true);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading post-checkout pages...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Enhanced Post-Checkout Manager</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Manage custom post-purchase experiences
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) {
              setEditingPage(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Page
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPage ? 'Edit Post-Checkout Page' : 'Create Post-Checkout Page'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Page Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => {
                        const name = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          name,
                          slug: generateSlug(name)
                        }));
                      }}
                      placeholder="e.g., Thank You Page"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="slug">URL Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                      placeholder="e.g., thank-you"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={formData.content.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      content: { ...prev.content, title: e.target.value }
                    }))}
                    placeholder="Order Complete!"
                  />
                </div>

                <div>
                  <Label htmlFor="message">Thank You Message</Label>
                  <Textarea
                    id="message"
                    value={formData.content.message}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      content: { ...prev.content, message: e.target.value }
                    }))}
                    placeholder="Thank you for your order..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="customHtml">Custom HTML (Optional)</Label>
                  <Textarea
                    id="customHtml"
                    value={formData.content.customHtml}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      content: { ...prev.content, customHtml: e.target.value }
                    }))}
                    placeholder="<div>Custom content here...</div>"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="redirectUrl">Redirect URL (Optional)</Label>
                    <Input
                      id="redirectUrl"
                      value={formData.content.redirectUrl}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        content: { ...prev.content, redirectUrl: e.target.value }
                      }))}
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="redirectDelay">Redirect Delay (seconds)</Label>
                    <Input
                      id="redirectDelay"
                      type="number"
                      value={formData.content.redirectDelay}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        content: { ...prev.content, redirectDelay: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Active</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingPage ? 'Update' : 'Create'} Page
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {pages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No post-checkout pages created yet.</p>
            <p className="text-sm mt-1">Create your first page to customize the post-purchase experience.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pages.map((page) => (
              <div key={page.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{page.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        /{page.slug}
                      </Badge>
                      {page.is_default && (
                        <Badge variant="default">
                          <Home className="w-3 h-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      {!page.is_active && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {page.content.title || 'No title set'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!page.is_default && page.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(page)}
                      >
                        <Home className="w-4 h-4 mr-1" />
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/post-checkout/${page.slug}`, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(page)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(page)}
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
  );
};