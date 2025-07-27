import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Copy, 
  ExternalLink, 
  ChevronDown, 
  ChevronRight,
  Calendar,
  DollarSign,
  Percent,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { formatCurrency } from '@/utils/currency';

interface Voucher {
  id: string;
  voucher_code: string;
  voucher_name: string;
  voucher_type: string;
  discount_value?: number;
  prepaid_amount?: number;
  minimum_spend: number;
  max_uses: number;
  current_uses: number;
  expires_at?: string;
  is_active: boolean;
  affiliate_id?: string;
  commission_rate: number;
  created_at: string;
  affiliates?: {
    name: string;
    company_name: string;
    affiliate_code: string;
  };
}

interface CreateVoucherForm {
  voucher_name: string;
  voucher_type: 'percentage' | 'fixed_amount' | 'prepaid_credit';
  discount_value: string;
  prepaid_amount: string;
  minimum_spend: string;
  max_uses: string;
  expires_at: string;
  affiliate_id: string;
  commission_rate: string;
}

export default function VoucherManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [expandedVouchers, setExpandedVouchers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const [form, setForm] = useState<CreateVoucherForm>({
    voucher_name: '',
    voucher_type: 'percentage',
    discount_value: '',
    prepaid_amount: '',
    minimum_spend: '0',
    max_uses: '1',
    expires_at: '',
    affiliate_id: '',
    commission_rate: '0'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load vouchers
      const { data: vouchersData, error: vouchersError } = await supabase
        .from('vouchers')
        .select(`
          *,
          affiliates (
            name,
            company_name,
            affiliate_code
          )
        `)
        .order('created_at', { ascending: false });

      if (vouchersError) throw vouchersError;

      // Load affiliates
      const { data: affiliatesData, error: affiliatesError } = await supabase
        .from('affiliates')
        .select('id, name, company_name, affiliate_code')
        .eq('status', 'active')
        .order('name');

      if (affiliatesError) throw affiliatesError;

      setVouchers(vouchersData || []);
      setAffiliates(affiliatesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load voucher data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateVoucherCode = () => {
    const prefix = form.voucher_name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 4);
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}${suffix}`;
  };

  const handleCreate = async () => {
    try {
      // Validate required fields
      if (!form.voucher_name.trim()) {
        toast({
          title: "Error",
          description: "Voucher name is required",
          variant: "destructive"
        });
        return;
      }

      if (form.voucher_type === 'percentage' && (!form.discount_value || parseFloat(form.discount_value) <= 0)) {
        toast({
          title: "Error", 
          description: "Discount percentage must be greater than 0",
          variant: "destructive"
        });
        return;
      }

      if (form.voucher_type === 'fixed_amount' && (!form.discount_value || parseFloat(form.discount_value) <= 0)) {
        toast({
          title: "Error",
          description: "Discount amount must be greater than 0", 
          variant: "destructive"
        });
        return;
      }

      if (form.voucher_type === 'prepaid_credit' && (!form.prepaid_amount || parseFloat(form.prepaid_amount) <= 0)) {
        toast({
          title: "Error",
          description: "Prepaid amount must be greater than 0",
          variant: "destructive"
        });
        return;
      }

      const voucherCode = generateVoucherCode();
      
      const voucherData = {
        voucher_code: voucherCode,
        voucher_name: form.voucher_name.trim(),
        voucher_type: form.voucher_type,
        discount_value: (form.voucher_type === 'percentage' || form.voucher_type === 'fixed_amount') 
          ? parseFloat(form.discount_value) || null : null,
        prepaid_amount: form.voucher_type === 'prepaid_credit' 
          ? parseFloat(form.prepaid_amount) || null : null,
        minimum_spend: parseFloat(form.minimum_spend) || 0,
        max_uses: parseInt(form.max_uses) || 1,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        affiliate_id: form.affiliate_id || null,
        commission_rate: parseFloat(form.commission_rate) || 0,
        is_active: true
      };

      console.log('Creating voucher with data:', voucherData);

      const { data, error } = await supabase
        .from('vouchers')
        .insert([voucherData])
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Voucher created successfully:', data);

      toast({
        title: "Success",
        description: `Voucher "${voucherCode}" created successfully!`
      });

      setIsCreateOpen(false);
      setForm({
        voucher_name: '',
        voucher_type: 'percentage',
        discount_value: '',
        prepaid_amount: '',
        minimum_spend: '0',
        max_uses: '1',
        expires_at: '',
        affiliate_id: '',
        commission_rate: '0'
      });
      loadData();
    } catch (error: any) {
      console.error('Error creating voucher:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create voucher",
        variant: "destructive"
      });
    }
  };

  const copyVoucherLink = (voucher: Voucher) => {
    const url = `${window.location.origin}?voucher=${voucher.voucher_code}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Voucher link copied to clipboard"
    });
  };

  const toggleVoucherStatus = async (voucher: Voucher) => {
    try {
      const { error } = await supabase
        .from('vouchers')
        .update({ is_active: !voucher.is_active })
        .eq('id', voucher.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Voucher ${voucher.is_active ? 'deactivated' : 'activated'}`
      });
      loadData();
    } catch (error) {
      console.error('Error updating voucher:', error);
      toast({
        title: "Error",
        description: "Failed to update voucher status",
        variant: "destructive"
      });
    }
  };

  const toggleExpanded = (voucherId: string) => {
    const newExpanded = new Set(expandedVouchers);
    if (newExpanded.has(voucherId)) {
      newExpanded.delete(voucherId);
    } else {
      newExpanded.add(voucherId);
    }
    setExpandedVouchers(newExpanded);
  };

  const getVoucherDisplayValue = (voucher: Voucher) => {
    switch (voucher.voucher_type) {
      case 'percentage':
        return `${voucher.discount_value}% off`;
      case 'fixed_amount':
        return `${formatCurrency(voucher.discount_value || 0)} off`;
      case 'prepaid_credit':
        return `${formatCurrency(voucher.prepaid_amount || 0)} credit`;
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading vouchers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Voucher Management</h3>
          <p className="text-sm text-muted-foreground">Create and manage discount vouchers and prepaid credits</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Voucher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Voucher</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="voucher_name">Voucher Name</Label>
                <Input
                  id="voucher_name"
                  value={form.voucher_name}
                  onChange={(e) => setForm({...form, voucher_name: e.target.value})}
                  placeholder="e.g., Summer Sale 2024"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="voucher_type">Voucher Type</Label>
                <Select value={form.voucher_type} onValueChange={(value: any) => setForm({...form, voucher_type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage Discount</SelectItem>
                    <SelectItem value="fixed_amount">Fixed Amount Discount</SelectItem>
                    <SelectItem value="prepaid_credit">Prepaid Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {form.voucher_type === 'percentage' && (
                <div className="space-y-2">
                  <Label htmlFor="discount_value">Discount Percentage</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount_value}
                    onChange={(e) => setForm({...form, discount_value: e.target.value})}
                    placeholder="e.g., 20"
                  />
                </div>
              )}

              {form.voucher_type === 'fixed_amount' && (
                <div className="space-y-2">
                  <Label htmlFor="discount_value">Discount Amount ($)</Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discount_value}
                    onChange={(e) => setForm({...form, discount_value: e.target.value})}
                    placeholder="e.g., 25.00"
                  />
                </div>
              )}

              {form.voucher_type === 'prepaid_credit' && (
                <div className="space-y-2">
                  <Label htmlFor="prepaid_amount">Prepaid Amount ($)</Label>
                  <Input
                    id="prepaid_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.prepaid_amount}
                    onChange={(e) => setForm({...form, prepaid_amount: e.target.value})}
                    placeholder="e.g., 100.00"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="minimum_spend">Minimum Spend ($)</Label>
                <Input
                  id="minimum_spend"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minimum_spend}
                  onChange={(e) => setForm({...form, minimum_spend: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses">Max Uses</Label>
                <Input
                  id="max_uses"
                  type="number"
                  min="1"
                  value={form.max_uses}
                  onChange={(e) => setForm({...form, max_uses: e.target.value})}
                  placeholder="1"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Expiration Date (Optional)</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({...form, expires_at: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="affiliate_id">Link to Affiliate (Optional)</Label>
                <Select value={form.affiliate_id} onValueChange={(value) => setForm({...form, affiliate_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select affiliate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Affiliate</SelectItem>
                    {affiliates.map((affiliate) => (
                      <SelectItem key={affiliate.id} value={affiliate.id}>
                        {affiliate.name} - {affiliate.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.affiliate_id && (
                <div className="space-y-2">
                  <Label htmlFor="commission_rate">Affiliate Commission (%)</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={form.commission_rate}
                    onChange={(e) => setForm({...form, commission_rate: e.target.value})}
                    placeholder="5.0"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!form.voucher_name}>
                Create Voucher
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Vouchers List */}
      <div className="space-y-4">
        {vouchers.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground mb-4">No vouchers created yet</div>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">
              Create Your First Voucher
            </Button>
          </Card>
        ) : (
          vouchers.map((voucher) => (
            <Collapsible key={voucher.id} open={expandedVouchers.has(voucher.id)}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedVouchers.has(voucher.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div>
                          <CardTitle className="text-lg">{voucher.voucher_name}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{voucher.voucher_code}</Badge>
                            <Badge variant={voucher.is_active ? 'default' : 'secondary'}>
                              {voucher.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {voucher.voucher_type === 'percentage' && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Percent className="h-3 w-3" />
                                {voucher.discount_value}% off
                              </Badge>
                            )}
                            {voucher.voucher_type === 'fixed_amount' && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(voucher.discount_value || 0)} off
                              </Badge>
                            )}
                            {voucher.voucher_type === 'prepaid_credit' && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {formatCurrency(voucher.prepaid_amount || 0)} credit
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {voucher.current_uses}/{voucher.max_uses} uses
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleVoucherStatus(voucher);
                          }}
                        >
                          {voucher.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <h5 className="font-medium text-sm text-muted-foreground mb-2">Voucher Details</h5>
                        <div className="space-y-1 text-sm">
                          <div>Type: {voucher.voucher_type.replace('_', ' ')}</div>
                          <div>Value: {getVoucherDisplayValue(voucher)}</div>
                          <div>Min. Spend: {formatCurrency(voucher.minimum_spend)}</div>
                          <div>Uses: {voucher.current_uses}/{voucher.max_uses}</div>
                          {voucher.expires_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Expires: {new Date(voucher.expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {voucher.affiliates && (
                        <div>
                          <h5 className="font-medium text-sm text-muted-foreground mb-2">Linked Affiliate</h5>
                          <div className="space-y-1 text-sm">
                            <div>Name: {voucher.affiliates.name}</div>
                            <div>Company: {voucher.affiliates.company_name}</div>
                            <div>Code: {voucher.affiliates.affiliate_code}</div>
                            <div>Commission: {voucher.commission_rate}%</div>
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <h5 className="font-medium text-sm text-muted-foreground mb-2">Actions</h5>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyVoucherLink(voucher)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Copy Link
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`${window.location.origin}?voucher=${voucher.voucher_code}`, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))
        )}
      </div>
    </div>
  );
}