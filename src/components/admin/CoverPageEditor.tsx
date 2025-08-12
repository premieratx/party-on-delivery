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
  bg_color?: string;
  text_color?: string;
}

export interface CoverPageConfig {
  id?: string;
  slug: string;
  title: string;
  subtitle?: string;
  logo_url?: string;
  logo_height?: number;
  bg_image_url?: string;
  bg_video_url?: string;
  checklist: string[];
  buttons: CoverButtonConfig[];
  is_active: boolean;
  styles?: { title_size?: number; subtitle_size?: number; checklist_size?: number; spacing_y?: number };
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
  const [logoHeight, setLogoHeight] = useState<number>(initial?.logo_height ?? 160);
  const [bgImageUrl, setBgImageUrl] = useState(initial?.bg_image_url || "");
  const [bgVideoUrl, setBgVideoUrl] = useState(initial?.bg_video_url || "");
  const [checklist, setChecklist] = useState<string[]>(initial?.checklist || ["", "", "", "", ""]);
  const [buttons, setButtons] = useState<CoverButtonConfig[]>(initial?.buttons || []);
  const [isActive, setIsActive] = useState<boolean>(initial?.is_active ?? true);
  const [titleSize, setTitleSize] = useState<number>((initial as any)?.styles?.title_size ?? 32);
  const [subtitleSize, setSubtitleSize] = useState<number>((initial as any)?.styles?.subtitle_size ?? 18);
  const [checklistSize, setChecklistSize] = useState<number>((initial as any)?.styles?.checklist_size ?? 14);

  const [apps, setApps] = useState<{ app_slug: string; app_name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [slugOk, setSlugOk] = useState(true);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const uploadAsset = async (file: File, kind: 'logo' | 'bg'): Promise<string | null> => {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const base = (computedSlug || slugify(title) || 'cover').slice(0, 60);
      const fileName = `cover-${base}-${kind}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('cover-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('cover-assets').getPublicUrl(fileName);
      return data.publicUrl;
    } catch (e: any) {
      console.error('Upload failed', e);
      toast({ title: 'Upload failed', description: e?.message || 'Try a smaller image', variant: 'destructive' });
      return null;
    }
  };

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
    setLogoHeight(initial?.logo_height ?? 80);
    setBgImageUrl(initial?.bg_image_url || "");
    setBgVideoUrl(initial?.bg_video_url || "");
    setChecklist(initial?.checklist && initial.checklist.length ? initial.checklist : ["", "", "", "", ""]);
    setButtons(initial?.buttons || []);
    setIsActive(initial?.is_active ?? true);
    setSlugOk(true);
    setTitleSize((initial as any)?.styles?.title_size ?? 32);
    setSubtitleSize((initial as any)?.styles?.subtitle_size ?? 18);
    setChecklistSize((initial as any)?.styles?.checklist_size ?? 14);
  }, [open, initial]);

  const computedSlug = useMemo(() => slugify(slug || title), [slug, title]);

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

  useEffect(() => { checkSlug(computedSlug); }, [computedSlug]);

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
      const payload: any = {
        slug: computedSlug,
        title,
        subtitle,
        logo_url: logoUrl || null,
        logo_height: logoHeight || null,
        bg_image_url: bgImageUrl || null,
        bg_video_url: bgVideoUrl || null,
        checklist: (checklist || []).filter(Boolean).slice(0, 5),
        buttons: buttons as any,
        is_active: isActive,
        styles: { title_size: titleSize, subtitle_size: subtitleSize, checklist_size: checklistSize, spacing_y: 20 },
      };

      if (isEditing && initial?.id) {
        const { error } = await supabase.from('cover_pages').update(payload as any).eq('id', initial.id);
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
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
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
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Title Size</Label>
                    <input type="range" min={20} max={56} value={titleSize} onChange={(e) => setTitleSize(Number(e.target.value))} className="w-full" />
                    <div className="text-xs text-muted-foreground">{titleSize}px</div>
                  </div>
                  <div>
                    <Label>Subtitle Size</Label>
                    <input type="range" min={12} max={32} value={subtitleSize} onChange={(e) => setSubtitleSize(Number(e.target.value))} className="w-full" />
                    <div className="text-xs text-muted-foreground">{subtitleSize}px</div>
                  </div>
                  <div>
                    <Label>Checklist Size</Label>
                    <input type="range" min={10} max={24} value={checklistSize} onChange={(e) => setChecklistSize(Number(e.target.value))} className="w-full" />
                    <div className="text-xs text-muted-foreground">{checklistSize}px</div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input id="logo" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label htmlFor="logoUpload">Upload Logo</Label>
                  <input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const url = await uploadAsset(file, 'logo');
                      if (url) setLogoUrl(url);
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">If no logo is provided, the default Party On Delivery logo will be used.</p>
                </div>
                <div>
                  <Label htmlFor="logoHeight">Logo Height (px)</Label>
                  <Input id="logoHeight" type="number" min={24} max={200} value={logoHeight ?? 80} onChange={(e) => setLogoHeight(Number(e.target.value) || 0)} />
                </div>
                <div>
                  <Label htmlFor="bgimg">Background Image URL</Label>
                  <Input id="bgimg" value={bgImageUrl} onChange={(e) => setBgImageUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div>
                  <Label htmlFor="bgvid">Background Video URL (optional)</Label>
                  <Input id="bgvid" value={bgVideoUrl} onChange={(e) => setBgVideoUrl(e.target.value)} placeholder="https://... or /videos/whiskey-pour-17370-360.mp4" />
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={() => { setBgImageUrl(''); setBgVideoUrl(''); }}>Use Default Old Fashioned Image</Button>
                    <Button variant="outline" size="sm" onClick={() => { setBgVideoUrl('/videos/whiskey-pour-17370-360.mp4'); setBgImageUrl(''); }}>Use Whiskey Pour Video</Button>
                    <Button variant="outline" size="sm" onClick={() => { setBgVideoUrl('/videos/whiskey-over-ice-5143-360.mp4'); setBgImageUrl(''); }}>Use Whiskey Over Ice Video</Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bgimgUpload">Upload Background Image</Label>
                  <input id="bgimgUpload" type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const url = await uploadAsset(file, 'bg');
                    if (url) setBgImageUrl(url);
                  }} />
                  <p className="text-xs text-muted-foreground mt-1">Tip: For videos, paste a URL instead. Images can be small uploads.</p>
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
                  <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} onBlur={(e) => checkSlug(slugify(e.target.value))} />
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
              <CardContent className="pt-6">
                <Label className="mb-2 block">Live Preview</Label>
                <div className="rounded-xl overflow-hidden bg-black/70 relative min-h-[520px] flex items-center justify-center">
                  <div className="text-center px-6 w-full max-w-md">
                    {logoUrl && (
                      <img src={logoUrl} alt="Logo preview" className="mx-auto block" style={{ height: logoHeight || 160 }} />
                    )}
                    <h3 className="mt-3 text-white font-bold" style={{ fontSize: titleSize }}>
                      {title || 'Title preview'}
                    </h3>
                    {subtitle && (
                      <p className="text-white/90 mt-1" style={{ fontSize: subtitleSize }}>{subtitle}</p>
                    )}
                    <div className="my-5">
                      {(checklist.filter(Boolean).slice(0,5)).map((c,i)=> (
                        <p key={i} className="text-white/80 my-5" style={{ fontSize: checklistSize }}>{c}</p>
                      ))}
                    </div>
                    <div className="min-h-[100px]" />
                    <div className="flex flex-col gap-2">
                      {(buttons || []).slice(0,3).map((b,i)=>(
                        <Button key={i} className="my-5" style={{ backgroundColor: b.bg_color || undefined, color: b.text_color || undefined }}>{b.text}</Button>
                      ))}
                    </div>
                  </div>
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

                      {/* Button colors */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Button Background Color</Label>
                          <input type="color" value={b.bg_color || '#0ea5e9'} onChange={(e) => updateButton(idx, { bg_color: e.target.value })} className="h-10 w-full rounded border" />
                        </div>
                        <div>
                          <Label>Button Text Color</Label>
                          <input type="color" value={b.text_color || '#ffffff'} onChange={(e) => updateButton(idx, { text_color: e.target.value })} className="h-10 w-full rounded border" />
                        </div>
                      </div>

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

        <div className="flex justify-between items-center gap-2 pt-4">
          <div className="text-xs text-muted-foreground">URL: /{computedSlug || '(unsaved)'}</div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              variant="secondary"
              onClick={() => window.open(`${window.location.origin}/${computedSlug}`, '_blank')}
              disabled={!computedSlug || !slugOk}
            >
              Preview
            </Button>
            <Button onClick={handleSave} disabled={saving || !slugOk}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CoverPageEditor;
