import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Code, 
  Copy, 
  ExternalLink,
  Monitor,
  Smartphone,
  Settings
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { buildCoverPageUrl, buildAppUrl } from '@/utils/links';

interface EmbedItem {
  id: string;
  name: string;
  slug: string;
  type: 'cover' | 'delivery';
  is_active?: boolean;
}

export const EmbedCodeManager: React.FC = () => {
  const [coverPages, setCoverPages] = useState<EmbedItem[]>([]);
  const [deliveryApps, setDeliveryApps] = useState<EmbedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EmbedItem | null>(null);
  const [embedWidth, setEmbedWidth] = useState('800');
  const [embedHeight, setEmbedHeight] = useState('600');
  const [popupWidth, setPopupWidth] = useState('900');
  const [popupHeight, setPopupHeight] = useState('700');

  const { toast } = useToast();

  // Load data
  const loadData = async () => {
    setLoading(true);
    try {
      const [coverResponse, deliveryResponse] = await Promise.all([
        supabase.from('cover_pages').select('id, title, slug, is_active').eq('is_active', true).order('created_at', { ascending: false }),
        supabase.from('delivery_app_variations').select('id, app_name, app_slug, is_active').order('created_at', { ascending: false })
      ]);

      if (coverResponse.data) {
        setCoverPages(coverResponse.data.map(page => ({
          id: page.id,
          name: page.title,
          slug: page.slug,
          type: 'cover' as const,
          is_active: page.is_active
        })));
      }

      if (deliveryResponse.data) {
        setDeliveryApps(deliveryResponse.data.map(app => ({
          id: app.id,
          name: app.app_name,
          slug: app.app_slug,
          type: 'delivery' as const,
          is_active: app.is_active
        })));
      }

    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error loading data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Generate embed code
  const generateEmbedCode = (item: EmbedItem, width: string, height: string) => {
    const url = item.type === 'cover' ? buildCoverPageUrl(item.slug) : buildAppUrl(item.slug);
    
    return `<!-- ${item.name} - Embed Code -->
<iframe 
  src="${url}" 
  width="${width}" 
  height="${height}" 
  frameborder="0" 
  scrolling="auto"
  style="border: none; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"
  title="${item.name}">
</iframe>`;
  };

  // Generate popup code
  const generatePopupCode = (item: EmbedItem, width: string, height: string) => {
    const url = item.type === 'cover' ? buildCoverPageUrl(item.slug) : buildAppUrl(item.slug);
    
    return `<!-- ${item.name} - Popup Code -->
<script>
function open${item.slug.replace(/-/g, '')}Popup() {
  const popup = window.open(
    '${url}',
    '${item.slug}_popup',
    'width=${width},height=${height},scrollbars=yes,resizable=yes,status=no,location=no,toolbar=no,menubar=no'
  );
  
  if (popup) {
    popup.focus();
  } else {
    alert('Please allow popups for this website');
  }
}
</script>

<!-- Trigger Button -->
<button onclick="open${item.slug.replace(/-/g, '')}Popup()" 
        style="background: #0066cc; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-size: 16px;">
  Open ${item.name}
</button>`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    toast({ title: `${type} copied to clipboard!` });
  };

  const allItems = [...coverPages, ...deliveryApps];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Embed & Popup Code Generator</h1>
        <p className="text-muted-foreground">
          Generate embed and popup codes for your cover pages and delivery apps
        </p>
      </div>

      {/* Item Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Select Item to Generate Code
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="grid gap-3">
              {allItems.map((item) => (
                <div 
                  key={item.id}
                  className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedItem?.id === item.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{item.name}</div>
                    <Badge variant={item.type === 'cover' ? 'default' : 'secondary'}>
                      {item.type === 'cover' ? 'Cover Page' : 'Delivery App'}
                    </Badge>
                    {item.is_active && (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground font-mono">
                    /{item.slug}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Generator */}
      {selectedItem && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Generate Code for "{selectedItem.name}"
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="embed" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="embed" className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  Embed (iframe)
                </TabsTrigger>
                <TabsTrigger value="popup" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Popup Window
                </TabsTrigger>
              </TabsList>

              {/* Embed Tab */}
              <TabsContent value="embed" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="embed-width">Width (pixels)</Label>
                    <Input
                      id="embed-width"
                      value={embedWidth}
                      onChange={(e) => setEmbedWidth(e.target.value)}
                      placeholder="800"
                    />
                  </div>
                  <div>
                    <Label htmlFor="embed-height">Height (pixels)</Label>
                    <Input
                      id="embed-height"
                      value={embedHeight}
                      onChange={(e) => setEmbedHeight(e.target.value)}
                      placeholder="600"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Embed Code</Label>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(generateEmbedCode(selectedItem, embedWidth, embedHeight), 'Embed code')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Code
                    </Button>
                  </div>
                  <Textarea
                    value={generateEmbedCode(selectedItem, embedWidth, embedHeight)}
                    readOnly
                    className="font-mono text-sm"
                    rows={8}
                  />
                </div>

                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                  <strong>How to use:</strong> Copy the code above and paste it into any HTML page where you want to embed this {selectedItem.type === 'cover' ? 'cover page' : 'delivery app'}.
                </div>
              </TabsContent>

              {/* Popup Tab */}
              <TabsContent value="popup" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="popup-width">Width (pixels)</Label>
                    <Input
                      id="popup-width"
                      value={popupWidth}
                      onChange={(e) => setPopupWidth(e.target.value)}
                      placeholder="900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="popup-height">Height (pixels)</Label>
                    <Input
                      id="popup-height"
                      value={popupHeight}
                      onChange={(e) => setPopupHeight(e.target.value)}
                      placeholder="700"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Popup Code</Label>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => copyToClipboard(generatePopupCode(selectedItem, popupWidth, popupHeight), 'Popup code')}
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Code
                    </Button>
                  </div>
                  <Textarea
                    value={generatePopupCode(selectedItem, popupWidth, popupHeight)}
                    readOnly
                    className="font-mono text-sm"
                    rows={12}
                  />
                </div>

                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
                  <strong>How to use:</strong> Copy the code above and paste it into any HTML page. This includes both the JavaScript function and a trigger button. You can customize the button styling or create your own trigger element.
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};