import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, Image, Video, Plus, Trash2, Tag, ExternalLink } from 'lucide-react';

interface MediaItem {
  id: string;
  filename: string;
  original_filename: string;
  file_type: 'image' | 'video';
  mime_type: string;
  file_size: number;
  storage_path: string;
  public_url: string;
  width?: number;
  height?: number;
  duration?: number;
  tags: string[];
  description?: string;
  created_at: string;
}

interface MediaLibraryManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMediaSelect?: (media: MediaItem) => void;
  selectMode?: boolean;
}

export const MediaLibraryManager: React.FC<MediaLibraryManagerProps> = ({
  open,
  onOpenChange,
  onMediaSelect,
  selectMode = false
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadMediaItems();
    }
  }, [open]);

  const loadMediaItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('media_library')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMediaItems((data || []) as MediaItem[]);
      
      // Extract unique tags
      const tags = new Set<string>();
      data?.forEach(item => {
        item.tags?.forEach(tag => tags.add(tag));
      });
      setAvailableTags(Array.from(tags));
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to load media: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFiles && !urlInput) return;

    setUploading(true);
    try {
      if (selectedFiles) {
        // Handle file uploads
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          await uploadFile(file);
        }
      } else if (urlInput) {
        // Handle URL input
        await handleUrlUpload();
      }

      setSelectedFiles(null);
      setUrlInput('');
      setTagInput('');
      setDescriptionInput('');
      await loadMediaItems();
      
      toast({
        title: "Success",
        description: "Media uploaded successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to upload: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const uploadFile = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('media-library')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('media-library')
      .getPublicUrl(filePath);

    // Get file dimensions for images/videos
    let width, height, duration;
    if (file.type.startsWith('image/')) {
      const dimensions = await getImageDimensions(file);
      width = dimensions.width;
      height = dimensions.height;
    } else if (file.type.startsWith('video/')) {
      const videoDimensions = await getVideoDimensions(file);
      width = videoDimensions.width;
      height = videoDimensions.height;
      duration = videoDimensions.duration;
    }

    // Insert into database
    const { error: dbError } = await supabase
      .from('media_library')
      .insert({
        filename: fileName,
        original_filename: file.name,
        file_type: file.type.startsWith('image/') ? 'image' : 'video',
        mime_type: file.type,
        file_size: file.size,
        storage_path: filePath,
        public_url: publicUrl,
        width,
        height,
        duration,
        tags: tagInput.split(',').map(tag => tag.trim()).filter(tag => tag),
        description: descriptionInput || null,
        uploaded_by: 'admin'
      });

    if (dbError) throw dbError;
  };

  const handleUrlUpload = async () => {
    if (!urlInput) return;

    // Create a unique filename for the URL
    const fileName = `url_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    const fileType = urlInput.toLowerCase().includes('.mp4') || urlInput.toLowerCase().includes('.mov') || urlInput.toLowerCase().includes('.webm') ? 'video' : 'image';

    // Insert into database
    const { error: dbError } = await supabase
      .from('media_library')
      .insert({
        filename: fileName,
        original_filename: urlInput.split('/').pop() || 'url_media',
        file_type: fileType,
        mime_type: fileType === 'video' ? 'video/mp4' : 'image/jpeg',
        file_size: 0,
        storage_path: urlInput,
        public_url: urlInput,
        tags: tagInput.split(',').map(tag => tag.trim()).filter(tag => tag),
        description: descriptionInput || null,
        uploaded_by: 'admin'
      });

    if (dbError) throw dbError;
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const getVideoDimensions = (file: File): Promise<{ width: number; height: number; duration: number }> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.onloadedmetadata = () => {
        resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
        URL.revokeObjectURL(video.src);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const deleteMedia = async (id: string, storagePath: string) => {
    try {
      // Delete from storage if it's not a URL
      if (!storagePath.startsWith('http')) {
        await supabase.storage.from('media-library').remove([storagePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('media_library')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadMediaItems();
      toast({
        title: "Success",
        description: "Media deleted successfully!"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to delete: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const filteredItems = mediaItems.filter(item => {
    const matchesSearch = item.original_filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => item.tags?.includes(tag));
    return matchesSearch && matchesTags;
  });

  const renderMediaGrid = (items: MediaItem[]) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.id} className="group relative bg-muted rounded-lg overflow-hidden">
          <div className="aspect-square relative">
            {item.file_type === 'image' ? (
              <img
                src={item.public_url}
                alt={item.original_filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-black flex items-center justify-center">
                <video
                  src={item.public_url}
                  className="w-full h-full object-cover"
                  muted
                  onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                  onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <Video className="w-8 h-8 text-white/70" />
                </div>
              </div>
            )}
          </div>
          
          <div className="p-2">
            <p className="text-xs font-medium truncate">{item.original_filename}</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {item.tags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs px-1 py-0">
                  {tag}
                </Badge>
              ))}
              {item.tags && item.tags.length > 2 && (
                <Badge variant="outline" className="text-xs px-1 py-0">
                  +{item.tags.length - 2}
                </Badge>
              )}
            </div>
          </div>

          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {selectMode && onMediaSelect && (
              <Button
                size="sm"
                onClick={() => {
                  onMediaSelect(item);
                  onOpenChange(false);
                }}
              >
                Select
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(item.public_url, '_blank')}
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteMedia(item.id, item.storage_path)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh]" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle>
            {selectMode ? 'Select Media' : 'Media Library Manager'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="library">Media Library</TabsTrigger>
            <TabsTrigger value="upload">Upload Media</TabsTrigger>
          </TabsList>

          <TabsContent value="library" className="flex-1 flex flex-col">
            <div className="flex gap-4 mb-4">
              <Input
                placeholder="Search media..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <div className="flex gap-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedTags(prev => 
                        prev.includes(tag) 
                          ? prev.filter(t => t !== tag)
                          : [...prev, tag]
                      );
                    }}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-muted-foreground">Loading media...</div>
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex items-center justify-center h-40">
                  <div className="text-center">
                    <Image className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No media found</p>
                  </div>
                </div>
              ) : (
                renderMediaGrid(filteredItems)
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upload" className="flex-1">
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Upload Files</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={(e) => setSelectedFiles(e.target.files)}
                    className="mt-1"
                  />
                </div>

                <div className="text-center">
                  <span className="text-muted-foreground">OR</span>
                </div>

                <div>
                  <Label htmlFor="url-input">Media URL</Label>
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    placeholder="party, background, confetti"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Optional description..."
                    value={descriptionInput}
                    onChange={(e) => setDescriptionInput(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={uploading || (!selectedFiles && !urlInput)}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Media
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};