import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MediaLibraryManager } from './MediaLibraryManager';
import { Image, Video, Link, FolderOpen, X } from 'lucide-react';

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

interface MediaPickerProps {
  value?: string;
  onValueChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  accept?: 'images' | 'videos' | 'all';
  className?: string;
}

export const MediaPicker: React.FC<MediaPickerProps> = ({
  value = '',
  onValueChange,
  label = 'Media',
  placeholder = 'Enter URL or select from library',
  accept = 'all',
  className = ''
}) => {
  const [urlInput, setUrlInput] = useState(value);
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    onValueChange(url);
  };

  const handleMediaSelect = (media: MediaItem) => {
    setSelectedMedia(media);
    setUrlInput(media.public_url);
    onValueChange(media.public_url);
    setShowLibrary(false);
  };

  const clearSelection = () => {
    setSelectedMedia(null);
    setUrlInput('');
    onValueChange('');
  };

  const getFileTypeFromUrl = (url: string): 'image' | 'video' | 'unknown' => {
    const videoExtensions = ['.mp4', '.mov', '.webm', '.avi', '.mkv'];
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
    
    const lowerUrl = url.toLowerCase();
    
    if (videoExtensions.some(ext => lowerUrl.includes(ext))) return 'video';
    if (imageExtensions.some(ext => lowerUrl.includes(ext))) return 'image';
    
    return 'unknown';
  };

  const renderPreview = () => {
    if (!urlInput) return null;

    const fileType = selectedMedia?.file_type || getFileTypeFromUrl(urlInput);

    return (
      <div className="mt-2 relative">
        <div className="aspect-video bg-muted rounded-lg overflow-hidden max-w-xs">
          {fileType === 'image' ? (
            <img
              src={urlInput}
              alt="Preview"
              className="w-full h-full object-cover"
              onError={() => {
                // Handle broken image
              }}
            />
          ) : fileType === 'video' ? (
            <video
              src={urlInput}
              className="w-full h-full object-cover"
              controls
              muted
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Link className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Media Preview</p>
              </div>
            </div>
          )}
        </div>
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="absolute -top-2 -right-2 w-6 h-6 p-0"
          onClick={clearSelection}
        >
          <X className="w-3 h-3" />
        </Button>

        {selectedMedia && (
          <div className="mt-2 text-sm text-muted-foreground">
            <p className="font-medium">{selectedMedia.original_filename}</p>
            {selectedMedia.tags.length > 0 && (
              <p>Tags: {selectedMedia.tags.join(', ')}</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={className}>
      {label && <Label className="text-base font-medium mb-2">{label}</Label>}
      
      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url" className="text-sm">
            <Link className="w-4 h-4 mr-2" />
            URL
          </TabsTrigger>
          <TabsTrigger value="library" className="text-sm">
            <FolderOpen className="w-4 h-4 mr-2" />
            Library
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="space-y-2">
          <Input
            type="url"
            placeholder={placeholder}
            value={urlInput}
            onChange={(e) => handleUrlChange(e.target.value)}
          />
          {renderPreview()}
        </TabsContent>

        <TabsContent value="library" className="space-y-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowLibrary(true)}
            className="w-full"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Choose from Library
          </Button>
          {renderPreview()}
        </TabsContent>
      </Tabs>

      <MediaLibraryManager
        open={showLibrary}
        onOpenChange={setShowLibrary}
        onMediaSelect={handleMediaSelect}
        selectMode={true}
      />
    </div>
  );
};