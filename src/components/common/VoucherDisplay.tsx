import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
  commission_rate: number;
}

interface VoucherDisplayProps {
  vouchers: Voucher[];
  title?: string;
}

export const VoucherDisplay: React.FC<VoucherDisplayProps> = ({ vouchers, title = "Your Vouchers" }) => {
  const { toast } = useToast();

  const copyVoucherLink = (voucher: Voucher) => {
    const url = `${window.location.origin}?voucher=${voucher.voucher_code}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Copied!",
      description: "Voucher link copied to clipboard"
    });
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

  if (vouchers.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          No vouchers assigned to you yet
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">{title}</h3>
      <div className="grid gap-4">
        {vouchers.map((voucher) => (
          <Card key={voucher.id} className={`${!voucher.is_active ? 'opacity-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium">{voucher.voucher_name}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline">{voucher.voucher_code}</Badge>
                    <Badge variant={voucher.is_active ? 'default' : 'secondary'}>
                      {voucher.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">
                      {getVoucherDisplayValue(voucher)}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    <div>Uses: {voucher.current_uses}/{voucher.max_uses}</div>
                    {voucher.minimum_spend > 0 && (
                      <div>Min. spend: {formatCurrency(voucher.minimum_spend)}</div>
                    )}
                    {voucher.expires_at && (
                      <div>Expires: {new Date(voucher.expires_at).toLocaleDateString()}</div>
                    )}
                    {voucher.commission_rate > 0 && (
                      <div>Commission: {voucher.commission_rate}%</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
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
                    onClick={() => {
                      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}?voucher=${voucher.voucher_code}`)}`;
                      window.open(qrUrl, '_blank');
                    }}
                  >
                    QR Code
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
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};