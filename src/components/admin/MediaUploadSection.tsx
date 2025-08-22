import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Image, Video, FileImage, FileVideo } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MediaUploadSectionProps {
  title: string;
  logoUrl?: string;
  onLogoUrlChange: (url: string) => void;
  backgroundImageUrl?: string;
  onBackgroundImageUrlChange: (url: string) => void;
  backgroundVideoUrl?: string;
  onBackgroundVideoUrlChange: (url: string) => void;
  componentType: 'cover' | 'delivery' | 'post-checkout';
}

export const MediaUploadSection: React.FC<MediaUploadSectionProps> = ({
  title,
  logoUrl,
  onLogoUrlChange,
  backgroundImageUrl,
  onBackgroundImageUrlChange,
  backgroundVideoUrl,
  onBackgroundVideoUrlChange,
  componentType
}) => {
  const [uploading, setUploading] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File, type: 'logo' | 'background-image' | 'background-video') => {
    setUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${componentType}/${type}/${Date.now()}-${Math.random()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('cover-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('cover-assets')
        .getPublicUrl(fileName);

      if (type === 'logo') {
        onLogoUrlChange(publicUrl);
      } else if (type === 'background-image') {
        onBackgroundImageUrlChange(publicUrl);
      } else if (type === 'background-video') {
        onBackgroundVideoUrlChange(publicUrl);
      }

      toast({
        title: 'Upload successful',
        description: `${type} uploaded successfully`
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: error?.message || 'Failed to upload file',
        variant: 'destructive'
      });
    } finally {
      setUploading(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'background-image' | 'background-video') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = type === 'background-video' ? 50 * 1024 * 1024 : 5 * 1024 * 1024; // 50MB for video, 5MB for images
    if (file.size > maxSize) {
      toast({
        title: 'File too large',
        description: `File must be smaller than ${type === 'background-video' ? '50MB' : '5MB'}`,
        variant: 'destructive'
      });
      return;
    }

    if (type === 'background-video' && !file.type.startsWith('video/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a video file',
        variant: 'destructive'
      });
      return;
    }

    if (type !== 'background-video' && !file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    uploadFile(file, type);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Image className="w-4 h-4" />
            Logo
          </Label>
          <div className="flex gap-3">
            <Input
              value={logoUrl || ''}
              onChange={(e) => onLogoUrlChange(e.target.value)}
              placeholder="https://example.com/logo.png or upload below"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading === 'logo'}
              onClick={() => document.getElementById('logo-upload')?.click()}
            >
              {uploading === 'logo' ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
            <input
              id="logo-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'logo')}
              className="hidden"
            />
          </div>
          {logoUrl && (
            <div className="relative w-20 h-20 border rounded-lg overflow-hidden bg-muted/10">
              <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                onClick={() => onLogoUrlChange('')}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Background Image Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileImage className="w-4 h-4" />
            Background Image
          </Label>
          <div className="flex gap-3">
            <Input
              value={backgroundImageUrl || ''}
              onChange={(e) => onBackgroundImageUrlChange(e.target.value)}
              placeholder="https://example.com/background.jpg or upload below"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading === 'background-image'}
              onClick={() => document.getElementById('bg-image-upload')?.click()}
            >
              {uploading === 'background-image' ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
            <input
              id="bg-image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'background-image')}
              className="hidden"
            />
          </div>
          {backgroundImageUrl && (
            <div className="relative w-32 h-20 border rounded-lg overflow-hidden bg-muted/10">
              <img src={backgroundImageUrl} alt="Background preview" className="w-full h-full object-cover" />
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                onClick={() => onBackgroundImageUrlChange('')}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Background Video Upload */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <FileVideo className="w-4 h-4" />
            Background Video
            <Badge variant="secondary" className="text-xs">Optional</Badge>
          </Label>
          <div className="flex gap-3">
            <Input
              value={backgroundVideoUrl || ''}
              onChange={(e) => onBackgroundVideoUrlChange(e.target.value)}
              placeholder="https://example.com/background.mp4 or upload below"
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              disabled={uploading === 'background-video'}
              onClick={() => document.getElementById('bg-video-upload')?.click()}
            >
              {uploading === 'background-video' ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
            <input
              id="bg-video-upload"
              type="file"
              accept="video/*"
              onChange={(e) => handleFileSelect(e, 'background-video')}
              className="hidden"
            />
          </div>
          {backgroundVideoUrl && (
            <div className="relative w-32 h-20 border rounded-lg overflow-hidden bg-muted/10">
              <video 
                src={backgroundVideoUrl} 
                className="w-full h-full object-cover" 
                muted 
                controls={false}
                onLoadedMetadata={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.currentTime = 1; // Show frame at 1 second
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <Video className="w-6 h-6 text-white" />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full"
                onClick={() => onBackgroundVideoUrlChange('')}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Images: Max 5MB (JPG, PNG, WebP)</p>
          <p>• Videos: Max 50MB (MP4, WebM)</p>
          <p>• Files are stored securely in Supabase Storage</p>
        </div>
      </CardContent>
    </Card>
  );
};