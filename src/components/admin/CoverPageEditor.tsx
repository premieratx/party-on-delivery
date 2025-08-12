import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Types
export type CoverButtonType = 'delivery_app' | 'checkout' | 'url'
export interface CoverButtonConfig {
  text: string;
  type: CoverButtonType;
  app_slug?: string;
  openCart?: boolean;
  url?: string;
}

export interface CoverPageConfig {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  logo_url?: string;
  bg_image_url?: string;
  bg_video_url?: string;
  checklist: string[];
  buttons: CoverButtonConfig[];
  is_active: boolean;
}

interface CoverPageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: CoverPageConfig | null;
  onSaved?: () => void;
}

const slugify = (s: string) => s
  .toLowerCase()
  .replace(/[^a-z0-9\-\s]/g, "")
  .trim()
  .replace(/\s+/g, "-")
  .replace(/\-+/g, "-");

export const CoverPageEditor: React.FC<CoverPageEditorProps> = ({ open, onOpenChange, initial, onSaved }) => {
  const isEditing = !!initial?.id;
  const { toast } = useToast();

  const [slug, setSlug] = useState(initial?.slug || "");
  const [title, setTitle] = useState(initial?.title || "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url || "");
  const [bgImageUrl, setBgImageUrl] = useState(initial?.bg_image_url || "");
  const [bgVideoUrl, setBgVideoUrl] = useState(initial?.bg_video_url || "");
  const [checklist, setChecklist] = useState<string[]>(initial?.checklist || ["", "", "", "", ""]);
  const [buttons, setButtons] = useState<CoverButtonConfig[]>(initial?.buttons || []);
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);

  const [apps, setApps] = useState<{ app_slug: string; app_name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [slugOk, setSlugOk] = useState(true);
  const [checkingSlug, setCheckingSlug] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('delivery_app_variations')
        .select('app_slug, app_name')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      setApps(data as any[] || []);
    })();
  }, []);

  useEffect(() => {
    if (!open) return;
    // hydrate from initial when opening
    setSlug(initial?.slug || "");
    setTitle(initial?.title || "");
    setSubtitle(initial?.subtitle || "");
    setLogoUrl(initial?.logo_url || "");
    setBgImageUrl(initial?.bg_image_url || "");
    setBgVideoUrl(initial?.bg_video_url || "");
    setChecklist(initial?.checklist && initial.checklist.length ? initial.checklist : ["", "", "", "", ""]);
    setButtons(initial?.buttons || []);
    setIsActive(initial?.is_active ?? true);
    setSlugOk(true);
  }, [open, initial]);

  const autoSlug = useMemo(() => slugify(title || slug), [title, slug]);

  const checkSlug = async (value: string) => {
    if (!value) { setSlugOk(false); return; }
    setCheckingSlug(true);
    const s = value;
    try {
      // 1) Check cover_pages
      const { data: cp } = await supabase
        .from('cover_pages')
        .select('id')
        .eq('slug', s)
        .maybeSingle();
      if (cp && (!isEditing || cp.id !== initial?.id)) { setSlugOk(false); return; }
      // 2) Check app short paths
      const { data: app } = await supabase
        .from('delivery_app_variations')
        .select('id')
        .eq('short_path', s)
        .maybeSingle();
      if (app) { setSlugOk(false); return; }
      // 3) Check affiliates
      const { data: aff } = await supabase
        .from('affiliates')
        .select('id')
        .eq('affiliate_code', s)
        .maybeSingle();
      if (aff) { setSlugOk(false); return; }
      setSlugOk(true);
    } finally {
      setCheckingSlug(false);
    }
  };

  useEffect(() => { checkSlug(autoSlug); }, [autoSlug]);

  const addButton = () => setButtons((prev) => [...prev, { text: `Button ${prev.length + 1}`, type: 'delivery_app' }]);
  const removeButton = (idx: number) => setButtons((prev) => prev.filter((_, i) => i !== idx));

  const updateButton = (idx: number, patch: Partial<CoverButtonConfig>) => {
    setButtons((prev) => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)));
  };

  const handleSave = async () => {
    if (!title) {
      toast({ title: 'Missing title', description: 'Please enter a title', variant: 'destructive' });
      return;
    }
    if (!slugOk) {
      toast({ title: 'Slug not available', description: 'Choose a different slug', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: autoSlug,
        title,
        subtitle,
        logo_url: logoUrl || null,
        bg_image_url: bgImageUrl || null,
        bg_video_url: bgVideoUrl || null,
        checklist: (checklist || []).filter(Boolean).slice(0, 5),
        buttons,
        is_active: isActive,
      };

      if (isEditing && initial?.id) {
        const { error } = await supabase.from('cover_pages').update(payload).eq('id', initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('cover_pages').insert(payload as any);
        if (error) throw error;
      }

      toast({ title: 'Saved', description: 'Cover page saved successfully' });
      onSaved?.();
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Save failed', description: e?.message || 'Please try again', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Cover Page' : 'New Cover Page'}</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="subtitle">Subtitle</Label>
                  <Input id="subtitle" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input id="logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label htmlFor="bgimg">Background Image URL</Label>
                  <Input id="bgimg" value={bgImageUrl} onChange={(e) => setBgImageUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label htmlFor="bgvid">Background Video URL (optional)</Label>
                  <Input id="bgvid" value={bgVideoUrl} onChange={(e) => setBgVideoUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label>Checklist (up to 5 rows)</Label>
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Input
                        key={i}
                        value={checklist[i] || ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          setChecklist((prev) => {
                            const next = [...prev];
                            next[i] = v;
                            return next;
                          });
                        }}
                        placeholder={`Row ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 pt-6">
                <div>
                  <Label htmlFor="slug">Slug (root URL)</Label>
                  <Input id="slug" value={autoSlug} onChange={(e) => setSlug(e.target.value)} onBlur={(e) => checkSlug(e.target.value)} />
                  <div className="text-xs mt-1">
                    {checkingSlug ? 'Checking…' : slugOk ? 'Available' : 'Not available'}
                  </div>
                </div>
                <div className="flex items-center justify-between py-1">
                  <Label htmlFor="active">Public</Label>
                  <Switch id="active" checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 pt-6">
                <div className="flex items-center justify-between">
                  <Label>Buttons</Label>
                  <Button size="sm" onClick={addButton}>Add Button</Button>
                </div>

                <div className="space-y-4">
                  {buttons.map((b, idx) => (
                    <div key={idx} className="rounded-md border p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Text</Label>
                          <Input value={b.text} onChange={(e) => updateButton(idx, { text: e.target.value })} />
                        </div>
                        <div>
                          <Label>Destination</Label>
                          <Select value={b.type} onValueChange={(v: CoverButtonType) => updateButton(idx, { type: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose destination" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="delivery_app">Delivery App</SelectItem>
                              <SelectItem value="checkout">Checkout</SelectItem>
                              <SelectItem value="url">Custom URL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {b.type === 'delivery_app' && (
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label>App</Label>
                            <Select value={b.app_slug} onValueChange={(v) => updateButton(idx, { app_slug: v })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select app" />
                              </SelectTrigger>
                              <SelectContent>
                                {apps.map((a) => (
                                  <SelectItem key={a.app_slug} value={a.app_slug}>{a.app_name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2 mt-6">
                            <Switch checked={!!b.openCart} onCheckedChange={(v) => updateButton(idx, { openCart: v })} id={`opencart-${idx}`} />
                            <Label htmlFor={`opencart-${idx}`}>Open cart on arrival</Label>
                          </div>
                        </div>
                      )}

                      {b.type === 'url' && (
                        <div>
                          <Label>URL</Label>
                          <Input value={b.url || ''} placeholder="https://..." onChange={(e) => updateButton(idx, { url: e.target.value })} />
                        </div>
                      )}

                      <div className="flex justify-end">
                        <Button variant="destructive" size="sm" onClick={() => removeButton(idx)}>Remove</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !slugOk}>{saving ? 'Saving…' : 'Save'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoverPageEditor;
