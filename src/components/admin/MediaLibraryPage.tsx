import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaLibraryManager } from '@/components/media/MediaLibraryManager';
import { FolderOpen, Plus, Image, Video, Database } from 'lucide-react';

export const MediaLibraryPage: React.FC = () => {
  const [showLibrary, setShowLibrary] = useState(false);

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-muted-foreground mt-2">
            Manage your photos and videos for use throughout the app
          </p>
        </div>
        <Button onClick={() => setShowLibrary(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Open Media Library
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5" />
              Storage Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload and organize your media files with tagging and search capabilities.
            </p>
            <ul className="text-sm space-y-1">
              <li>• Upload images and videos</li>
              <li>• Add from URLs</li>
              <li>• Tag and categorize</li>
              <li>• Search and filter</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Image className="w-5 h-5" />
              Image Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Supports all common image formats with automatic resizing and optimization.
            </p>
            <ul className="text-sm space-y-1">
              <li>• JPG, PNG, GIF, WebP</li>
              <li>• SVG vector graphics</li>
              <li>• Automatic dimensions</li>
              <li>• Web optimization</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Video className="w-5 h-5" />
              Video Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upload and manage video content for backgrounds and hero sections.
            </p>
            <ul className="text-sm space-y-1">
              <li>• MP4, WebM, MOV</li>
              <li>• Auto-play preview</li>
              <li>• Duration tracking</li>
              <li>• Background videos</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usage Throughout App</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Media from your library can be used in the following places:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Cover Pages</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Background images/videos</li>
                  <li>• Logo uploads</li>
                  <li>• Feature icons</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Delivery Apps</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Hero section backgrounds</li>
                  <li>• App logos and branding</li>
                  <li>• Promotional banners</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Product Displays</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Category banners</li>
                  <li>• Promotional graphics</li>
                  <li>• Custom backgrounds</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">General UI</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Page backgrounds</li>
                  <li>• Decorative elements</li>
                  <li>• Custom branding</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Quick Access</h4>
              <p className="text-sm text-muted-foreground">
                When configuring any media field throughout the app, you'll see a "Media Picker" 
                that allows you to either paste a URL or select from your organized library.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <MediaLibraryManager
        open={showLibrary}
        onOpenChange={setShowLibrary}
        selectMode={false}
      />
    </div>
  );
};