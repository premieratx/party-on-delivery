import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export const CoverPageToggle = () => {
  const [coverPagesEnabled, setCoverPagesEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load current setting from localStorage
    const setting = localStorage.getItem('admin-cover-pages-enabled');
    setCoverPagesEnabled(setting === 'true');
  }, []);

  const handleToggle = async (enabled: boolean) => {
    setLoading(true);
    try {
      // Store setting in localStorage for now
      localStorage.setItem('admin-cover-pages-enabled', enabled.toString());
      setCoverPagesEnabled(enabled);
      
      toast({
        title: enabled ? "Cover Pages Enabled" : "Cover Pages Disabled",
        description: enabled 
          ? "Cover pages will now show to users on app load"
          : "Cover pages are now disabled site-wide",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cover page setting",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cover Page Settings</CardTitle>
        <CardDescription>
          Control whether cover pages are displayed to users when they load the app
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Switch 
            id="cover-pages-toggle"
            checked={coverPagesEnabled}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
          <Label htmlFor="cover-pages-toggle">
            {coverPagesEnabled ? "Cover Pages Enabled" : "Cover Pages Disabled"}
          </Label>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {coverPagesEnabled 
            ? "Users will see cover pages when loading apps"
            : "Users will go directly to app content without cover pages"
          }
        </p>
      </CardContent>
    </Card>
  );
};