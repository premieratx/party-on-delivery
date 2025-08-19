import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit, Save, X, DollarSign, User, Mail, Building } from 'lucide-react';

interface Affiliate {
  id: string;
  name: string;
  email: string;
  company_name: string;
  affiliate_code: string;
  custom_handle: string;
  commission_rate: number;
  commission_type: string;
  total_sales: number;
  total_commission: number;
  orders_count: number;
  status: string;
  created_at: string;
}

export const AffiliateManager = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Affiliate>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadAffiliates();
  }, []);

  const loadAffiliates = async () => {
    try {
      const { data, error } = await supabase
        .from('affiliates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAffiliates(data || []);
    } catch (error) {
      console.error('Error loading affiliates:', error);
      toast({
        title: "Error",
        description: "Failed to load affiliates",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (affiliate: Affiliate) => {
    setEditingId(affiliate.id);
    setEditForm({
      custom_handle: affiliate.custom_handle,
      commission_rate: affiliate.commission_rate,
      commission_type: affiliate.commission_type,
      status: affiliate.status
    });
  };

  const handleSave = async (affiliateId: string) => {
    try {
      // Validate custom handle uniqueness
      if (editForm.custom_handle) {
        const { data: existing } = await supabase
          .from('affiliates')
          .select('id')
          .eq('custom_handle', editForm.custom_handle)
          .neq('id', affiliateId)
          .single();

        if (existing) {
          toast({
            title: "Error",
            description: "This handle is already taken",
            variant: "destructive"
          });
          return;
        }
      }

      const { error } = await supabase
        .from('affiliates')
        .update({
          custom_handle: editForm.custom_handle,
          commission_rate: editForm.commission_rate,
          commission_type: editForm.commission_type,
          status: editForm.status
        })
        .eq('id', affiliateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Affiliate updated successfully"
      });

      setEditingId(null);
      loadAffiliates();
    } catch (error) {
      console.error('Error updating affiliate:', error);
      toast({
        title: "Error",
        description: "Failed to update affiliate",
        variant: "destructive"
      });
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'pending': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading affiliates...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Affiliate Management
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Affiliate</TableHead>
                <TableHead>Handle</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Stats</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affiliates.map((affiliate) => (
                <TableRow key={affiliate.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {affiliate.name}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {affiliate.email}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Building className="h-3 w-3" />
                        {affiliate.company_name}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {affiliate.affiliate_code}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {editingId === affiliate.id ? (
                      <Input
                        value={editForm.custom_handle || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, custom_handle: e.target.value }))}
                        placeholder="custom-handle"
                        className="w-32"
                      />
                    ) : (
                      <Badge variant="secondary">
                        {affiliate.custom_handle || 'Not set'}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editingId === affiliate.id ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={editForm.commission_rate || 0}
                            onChange={(e) => setEditForm(prev => ({ ...prev, commission_rate: parseFloat(e.target.value) }))}
                            className="w-20"
                            min="0"
                            max="100"
                            step="0.5"
                          />
                          <span className="text-sm">%</span>
                        </div>
                        <Select
                          value={editForm.commission_type || 'percent'}
                          onValueChange={(value) => setEditForm(prev => ({ ...prev, commission_type: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {affiliate.commission_rate}
                        {affiliate.commission_type === 'percent' ? '%' : ' fixed'}
                      </div>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div>${affiliate.total_sales?.toFixed(2) || '0.00'} sales</div>
                      <div>${affiliate.total_commission?.toFixed(2) || '0.00'} earned</div>
                      <div>{affiliate.orders_count || 0} orders</div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    {editingId === affiliate.id ? (
                      <Select
                        value={editForm.status || affiliate.status}
                        onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getStatusBadgeVariant(affiliate.status)}>
                        {affiliate.status}
                      </Badge>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    {editingId === affiliate.id ? (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSave(affiliate.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancel}
                          className="h-8 w-8 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(affiliate)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {affiliates.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No affiliates found. They will appear here once they sign up.
          </div>
        )}
      </CardContent>
    </Card>
  );
};