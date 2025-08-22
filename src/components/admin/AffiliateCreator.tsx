import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AffiliateCreatorProps {
  onCreated?: () => void;
}

interface DeliveryAppOption {
  id: string;
  app_name: string;
  app_slug: string;
}

export const AffiliateCreator: React.FC<AffiliateCreatorProps> = ({ onCreated }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apps, setApps] = useState<DeliveryAppOption[]>([]);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    venmo_handle: '',
    commission_type: 'percent' as 'percent' | 'flat',
    commission_value: '',
    // Removed delivery_app_id - standalone architecture
  });

  useEffect(() => {
    async function loadApps() {
      const { data, error } = await supabase
        .from('delivery_app_variations')
        .select('id, app_name, app_slug')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (!error) setApps((data as any[]) as DeliveryAppOption[]);
    }
    if (open) loadApps();
  }, [open]);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.company_name) {
      toast({ title: 'Missing info', description: 'Name, email and company are required.', variant: 'destructive' });
      return;
    }

    const commissionValue = parseFloat(form.commission_value || '0');
    if (form.commission_type === 'percent' && (isNaN(commissionValue) || commissionValue < 0 || commissionValue > 100)) {
      toast({ title: 'Invalid commission', description: 'Percent must be between 0 and 100.', variant: 'destructive' });
      return;
    }
    if (form.commission_type === 'flat' && (isNaN(commissionValue) || commissionValue < 0)) {
      toast({ title: 'Invalid commission', description: 'Flat commission must be 0 or more.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      // Generate affiliate code
      const { data: codeRes, error: codeErr } = await supabase.rpc('generate_affiliate_code', { company_name: form.company_name });
      if (codeErr) throw codeErr;
      const affiliate_code = (codeRes as string) || Math.random().toString(36).slice(2, 8).toUpperCase();

      // Create affiliate
      const { data: affiliate, error: affErr } = await supabase
        .from('affiliates')
        .insert({
          name: form.name,
          email: form.email,
          phone: form.phone,
          company_name: form.company_name,
          venmo_handle: form.venmo_handle || null,
          affiliate_code,
          status: 'active',
          commission_rate: form.commission_type === 'percent' ? commissionValue : 0,
          commission_type: form.commission_type,
          commission_value: commissionValue
        })
        .select()
        .single();
      if (affErr) throw affErr;

      // Removed delivery app assignments - standalone architecture
      // No delivery app connections needed

      toast({ title: 'Affiliate created', description: `Code: ${affiliate_code}` });
      setOpen(false);
      setForm({
        name: '', email: '', phone: '', company_name: '', venmo_handle: '',
        commission_type: 'percent', commission_value: '' // Removed delivery_app_id
      });
      onCreated?.();
    } catch (e: any) {
      console.error(e);
      toast({ title: 'Error', description: e.message || 'Failed to create affiliate', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="w-4 h-4 mr-2"/>Add Affiliate</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle>New Affiliate</DialogTitle>
          <DialogDescription id="dialog-description">
            Create a new affiliate account with commission settings and optional delivery app assignment.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Company</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Venmo (optional)</Label>
            <Input value={form.venmo_handle} onChange={(e) => setForm({ ...form, venmo_handle: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Commission Type</Label>
              <Select value={form.commission_type} onValueChange={(v) => setForm({ ...form, commission_type: v as any })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">Percent (%)</SelectItem>
                  <SelectItem value="flat">Flat ($ per order)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{form.commission_type === 'flat' ? 'Flat Amount ($)' : 'Rate (%)'}</Label>
              <Input value={form.commission_value} onChange={(e) => setForm({ ...form, commission_value: e.target.value })} />
            </div>
          </div>
          {/* Delivery app assignment removed - standalone architecture */}
          <div className="pt-2 flex justify-end">
            <Button onClick={handleCreate} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
              Create Affiliate
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


