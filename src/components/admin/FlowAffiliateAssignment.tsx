import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { UserCheck, Users, Link as LinkIcon } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

interface Affiliate {
  id: string;
  name: string;
  company_name: string;
  affiliate_code: string;
  email: string;
  status: string;
}

interface FlowAffiliateAssignmentProps {
  selectedAffiliate?: string;
  onAffiliateChange: (affiliateId: string | null) => void;
  customSlug?: string;
  onCustomSlugChange: (slug: string) => void;
  enableTracking?: boolean;
  onEnableTrackingChange: (enabled: boolean) => void;
}

export const FlowAffiliateAssignment: React.FC<FlowAffiliateAssignmentProps> = ({
  selectedAffiliate,
  onAffiliateChange,
  customSlug,
  onCustomSlugChange,
  enableTracking = true,
  onEnableTrackingChange
}) => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('id, name, company_name, affiliate_code, email, status')
        .eq('status', 'active')
        .order('company_name');

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      console.error('Error loading affiliates:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlugFromAffiliate = (affiliateId: string) => {
    const affiliate = affiliates.find(a => a.id === affiliateId);
    if (affiliate) {
      const slug = affiliate.company_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      onCustomSlugChange(slug);
    }
  };

  const handleAffiliateChange = (value: string) => {
    const affiliateId = value === 'none' ? null : value;
    onAffiliateChange(affiliateId);
    
    if (affiliateId && !customSlug) {
      generateSlugFromAffiliate(affiliateId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="w-5 h-5" />
          Affiliate Assignment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Affiliate Tracking Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Enable Affiliate Tracking</Label>
            <p className="text-xs text-muted-foreground">
              Track referrals and commissions for this flow
            </p>
          </div>
          <Switch
            checked={enableTracking}
            onCheckedChange={onEnableTrackingChange}
          />
        </div>

        {enableTracking && (
          <>
            {/* Affiliate Selection */}
            <div className="space-y-3">
              <Label htmlFor="affiliate-select" className="text-sm font-medium">
                Assign Affiliate
              </Label>
              <Select
                value={selectedAffiliate || 'none'}
                onValueChange={handleAffiliateChange}
                disabled={loading}
              >
                <SelectTrigger id="affiliate-select">
                  <SelectValue placeholder="Select an affiliate..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      No Affiliate (Public Flow)
                    </div>
                  </SelectItem>
                  {affiliates.map((affiliate) => (
                    <SelectItem key={affiliate.id} value={affiliate.id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col">
                          <span className="font-medium">{affiliate.company_name}</span>
                          <span className="text-xs text-muted-foreground">{affiliate.name}</span>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {affiliate.affiliate_code}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom Slug */}
            <div className="space-y-3">
              <Label htmlFor="custom-slug" className="text-sm font-medium flex items-center gap-2">
                <LinkIcon className="w-4 h-4" />
                Custom Flow Slug
              </Label>
              <Input
                id="custom-slug"
                value={customSlug || ''}
                onChange={(e) => onCustomSlugChange(e.target.value)}
                placeholder="custom-flow-name"
                className="font-mono text-sm"
              />
              <div className="text-xs text-muted-foreground">
                <p>This creates a unique URL for the flow: <code className="bg-muted px-1 rounded">/{customSlug || 'your-slug'}</code></p>
                <p>Use only lowercase letters, numbers, and hyphens</p>
              </div>
            </div>

            {/* Affiliate Info Display */}
            {selectedAffiliate && (
              <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                <div className="text-sm">
                  <p className="font-medium text-foreground">Selected Affiliate:</p>
                  {(() => {
                    const affiliate = affiliates.find(a => a.id === selectedAffiliate);
                    return affiliate ? (
                      <div className="mt-2 space-y-1">
                        <p><strong>Company:</strong> {affiliate.company_name}</p>
                        <p><strong>Contact:</strong> {affiliate.name}</p>
                        <p><strong>Code:</strong> {affiliate.affiliate_code}</p>
                        <p><strong>Email:</strong> {affiliate.email}</p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground mt-1">Affiliate not found</p>
                    );
                  })()}
                </div>
              </div>
            )}
          </>
        )}

        {!enableTracking && (
          <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Affiliate tracking is disabled. This flow will operate as a public flow without commission tracking.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};