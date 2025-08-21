import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EnhancedCoverPageCreator } from "../enhanced-admin/EnhancedCoverPageCreator";
import { Wand2, Layout, Sparkles, Eye } from 'lucide-react';

interface UnifiedCoverPageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

export const UnifiedCoverPageEditor: React.FC<UnifiedCoverPageEditorProps> = ({
  open,
  onOpenChange,
  initial,
  onSaved
}) => {
  return (
    <EnhancedCoverPageCreator
      open={open}
      onOpenChange={onOpenChange}
      initial={initial}
      onSaved={onSaved}
    />
  );
};

// Export types for compatibility
export type CoverButtonType = 'delivery_app' | 'checkout' | 'url';
export interface CoverButtonConfig {
  text: string;
  type: CoverButtonType;
  app_slug?: string;
  openCart?: boolean;
  url?: string;
  bg_color?: string;
  text_color?: string;
  affiliate_code?: string;
  free_shipping?: boolean;
  markup_percent?: number;
  prefill_enabled?: boolean;
  prefill_address?: {
    street?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    instructions?: string;
  };
  offset_y?: number;
  spacing_below?: number;
  style: 'filled' | 'outline';
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
  affiliate_id?: string;
  affiliate_slug?: string;
  theme?: string;
  styles?: any;
  is_default_homepage?: boolean;
  flow_name?: string;
  is_multi_flow?: boolean;
  free_shipping_enabled?: boolean;
}