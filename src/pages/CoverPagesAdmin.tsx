import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CoverPageEditor, CoverPageConfig } from '@/components/admin/CoverPageEditor';
import { Copy, ExternalLink, Plus, RefreshCcw, Edit, Trash } from 'lucide-react';
import { CANONICAL_DOMAIN } from '@/utils/links';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const CoverPagesAdmin: React.FC = () => {
  const { toast } = useToast();
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CoverPageConfig | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('cover_pages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to load cover pages', variant: 'destructive' });
    } else {
      setPages(data || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // Admin SEO (lightweight)
  useEffect(() => {
    document.title = 'Cover Pages Admin | Party On Delivery';
    const desc = 'Create and manage public cover pages with multi-CTA modals.';
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    meta.content = desc;

    // Canonical
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = `${CANONICAL_DOMAIN}/admin/cover-pages`;
  }, []);

  const filtered = useMemo(() => {
    if (!search) return pages;
    return pages.filter((p) => (p.title || '').toLowerCase().includes(search.toLowerCase()) || (p.slug || '').includes(search.toLowerCase()));
  }, [pages, search]);

  const openNew = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (p: any) => {
    const cfg: CoverPageConfig = {
      id: p.id,
      slug: p.slug,
      title: p.title,
      subtitle: p.subtitle || '',
      logo_url: p.logo_url || '',
      logo_height: p.logo_height ?? 160,
      bg_image_url: p.bg_image_url || '',
      bg_video_url: p.bg_video_url || '',
      checklist: (p.checklist || []) as string[],
      buttons: (p.buttons || []) as any,
      is_active: !!p.is_active,
      styles: p.styles || {},
    };
    setEditing(cfg);
    setEditorOpen(true);
  };

  const copyUrl = (slug: string) => {
    const url = `${CANONICAL_DOMAIN}/${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Copied', description: url });
  };

  const handleDelete = async (id: string, title: string) => {
    const { error } = await supabase.from('cover_pages').delete().eq('id', id);
    if (error) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to delete cover page', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: `Removed “${title}”` });
      load();
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="container mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Cover Pages</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load}><RefreshCcw className="h-4 w-4 mr-2" />Refresh</Button>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" />New Cover Page</Button>
          </div>
        </div>

        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle>All Cover Pages</CardTitle>
            <div className="w-full sm:w-64">
              <Input placeholder="Search by title or slug" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
                Loading...
              </div>
            ) : (
              <div className="grid gap-4">
                {filtered.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No cover pages yet.</div>
                ) : (
                  filtered.map((p) => (
                    <div key={p.id} className="rounded-md border p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">/{p.slug}</div>
                        <div className="text-xs text-muted-foreground">Buttons: {(p.buttons || []).length} • Public: {p.is_active ? 'Yes' : 'No'}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => copyUrl(p.slug)}><Copy className="h-4 w-4 mr-1" />Copy URL</Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(`${CANONICAL_DOMAIN}/${p.slug}`, '_blank')}><ExternalLink className="h-4 w-4 mr-1" />Open</Button>
                        <Button size="sm" onClick={() => openEdit(p)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm"><Trash className="h-4 w-4 mr-1" />Delete</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete cover page?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete "{p.title}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(p.id, p.title)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <CoverPageEditor open={editorOpen} onOpenChange={setEditorOpen} initial={editing} onSaved={load} />
    </div>
  );
};

export default CoverPagesAdmin;
