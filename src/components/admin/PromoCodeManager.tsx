import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Edit, Trash2, Tag, Calendar, Percent } from 'lucide-react';

interface PromoCode {
  id: string;
  voucher_code: string;
  voucher_name: string;
  voucher_type: string;
  discount_value: number;
  minimum_spend: number;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  commission_rate: number;
}

export function PromoCodeManager() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    voucher_code: '',
    voucher_name: '',
    voucher_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_value: 0,
    minimum_spend: 0,
    max_uses: 1000,
    commission_rate: 0,
    expires_at: ''
  });

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vouchers')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Error loading promo codes:', error);
      toast({
        title: "Error",
        description: "Failed to load promo codes",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // For free shipping, set discount_value to 9999 (our convention)
      const finalData = {
        ...formData,
        discount_value: formData.voucher_type === 'fixed_amount' && formData.discount_value === 0 
          ? 9999 // Free shipping indicator
          : formData.discount_value,
        expires_at: formData.expires_at || null
      };

      if (editingCode) {
        const { error } = await supabase
          .from('vouchers')
          .update(finalData)
          .eq('id', editingCode.id);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Promo code updated successfully"
        });
      } else {
        const { error } = await supabase
          .from('vouchers')
          .insert([{
            ...finalData,
            is_active: true,
            current_uses: 0
          }]);
        
        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Promo code created successfully"
        });
      }

      // Reset form and reload data
      setFormData({
        voucher_code: '',
        voucher_name: '',
        voucher_type: 'percentage',
        discount_value: 0,
        minimum_spend: 0,
        max_uses: 1000,
        commission_rate: 0,
        expires_at: ''
      });
      setShowCreateForm(false);
      setEditingCode(null);
      await loadPromoCodes();
    } catch (error) {
      console.error('Error saving promo code:', error);
      toast({
        title: "Error",
        description: "Failed to save promo code",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (code: PromoCode) => {
    setEditingCode(code);
    setFormData({
      voucher_code: code.voucher_code,
      voucher_name: code.voucher_name,
      voucher_type: code.voucher_type as 'percentage' | 'fixed_amount',
      discount_value: code.discount_value === 9999 ? 0 : code.discount_value, // Convert back from free shipping indicator
      minimum_spend: code.minimum_spend,
      max_uses: code.max_uses,
      commission_rate: code.commission_rate,
      expires_at: code.expires_at ? code.expires_at.split('T')[0] : ''
    });
    setShowCreateForm(true);
  };

  const handleDeactivate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vouchers')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Promo code deactivated"
      });
      
      await loadPromoCodes();
    } catch (error) {
      console.error('Error deactivating promo code:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate promo code",
        variant: "destructive"
      });
    }
  };

  const formatDiscountDisplay = (code: PromoCode) => {
    if (code.discount_value >= 9999) {
      return 'Free Shipping';
    }
    return code.voucher_type === 'percentage' 
      ? `${code.discount_value}% off`
      : `$${code.discount_value} off`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Promo Codes...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Promo Code Management ({promoCodes.length} active)
            </CardTitle>
            <Button 
              onClick={() => {
                setShowCreateForm(true);
                setEditingCode(null);
                setFormData({
                  voucher_code: '',
                  voucher_name: '',
                  voucher_type: 'percentage',
                  discount_value: 0,
                  minimum_spend: 0,
                  max_uses: 1000,
                  commission_rate: 0,
                  expires_at: ''
                });
              }}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Promo Code
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCode ? 'Edit Promo Code' : 'Create New Promo Code'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="voucher_code">Code</Label>
                  <Input
                    id="voucher_code"
                    value={formData.voucher_code}
                    onChange={(e) => setFormData({...formData, voucher_code: e.target.value.toUpperCase()})}
                    placeholder="PROMO2025"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="voucher_name">Name</Label>
                  <Input
                    id="voucher_name"
                    value={formData.voucher_name}
                    onChange={(e) => setFormData({...formData, voucher_name: e.target.value})}
                    placeholder="Holiday Sale"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="voucher_type">Type</Label>
                  <Select value={formData.voucher_type} onValueChange={(value: 'percentage' | 'fixed_amount') => setFormData({...formData, voucher_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage Off</SelectItem>
                      <SelectItem value="fixed_amount">Free Shipping</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discount_value">
                    {formData.voucher_type === 'percentage' ? 'Percentage' : 'Amount'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({...formData, discount_value: Number(e.target.value)})}
                    placeholder={formData.voucher_type === 'percentage' ? '20' : '0 for free shipping'}
                    min="0"
                    max={formData.voucher_type === 'percentage' ? '100' : undefined}
                  />
                </div>
                <div>
                  <Label htmlFor="minimum_spend">Minimum Spend ($)</Label>
                  <Input
                    id="minimum_spend"
                    type="number"
                    value={formData.minimum_spend}
                    onChange={(e) => setFormData({...formData, minimum_spend: Number(e.target.value)})}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="max_uses">Max Uses</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({...formData, max_uses: Number(e.target.value)})}
                    placeholder="1000"
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                  <Input
                    id="commission_rate"
                    type="number"
                    value={formData.commission_rate}
                    onChange={(e) => setFormData({...formData, commission_rate: Number(e.target.value)})}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <Label htmlFor="expires_at">Expiry Date (optional)</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({...formData, expires_at: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">
                  {editingCode ? 'Update' : 'Create'} Promo Code
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingCode(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Promo Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>Active Promo Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {promoCodes.length > 0 ? (
            <div className="space-y-4">
              {promoCodes.map((code) => (
                <div key={code.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <Badge variant="default" className="text-lg font-mono">
                      {code.voucher_code}
                    </Badge>
                    <div>
                      <div className="font-medium">{code.voucher_name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {formatDiscountDisplay(code)}
                        </span>
                        {code.minimum_spend > 0 && (
                          <span>Min: ${code.minimum_spend}</span>
                        )}
                        {code.expires_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Expires: {new Date(code.expires_at).toLocaleDateString()}
                          </span>
                        )}
                        {code.commission_rate > 0 && (
                          <span>Commission: {code.commission_rate}%</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {code.current_uses}/{code.max_uses} uses
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {Math.round((code.current_uses / code.max_uses) * 100)}% used
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(code)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeactivate(code.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No active promo codes found. Create your first one above.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}