import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface QuoteItem {
  id: string;
  name: string;
  price: number;
  category: string;
  type: 'single' | 'multiple' | 'quantity';
  selected: boolean;
  quantity: number;
  description?: string;
}

interface QuoteBuilderProps {
  eventType?: string;
  onGenerateQuote?: (items: QuoteItem[], totals: any) => void;
}

export const EnhancedQuoteBuilder: React.FC<QuoteBuilderProps> = ({ 
  eventType = 'Wedding Package',
  onGenerateQuote 
}) => {
  const [selectedPackage, setSelectedPackage] = useState('premium');
  const [tipPercentage, setTipPercentage] = useState(18);
  const [items, setItems] = useState<QuoteItem[]>([
    // Beverage Packages
    { id: '1', name: 'Basic Bar Package', price: 850, category: 'Beverage Packages', type: 'single', selected: false, quantity: 1, description: '4 hours, beer & wine only' },
    { id: '2', name: 'Premium Bar Package', price: 1250, category: 'Beverage Packages', type: 'single', selected: true, quantity: 1, description: '4 hours, full bar service' },
    { id: '3', name: 'Luxury Bar Package', price: 1750, category: 'Beverage Packages', type: 'single', selected: false, quantity: 1, description: '5 hours, premium spirits & champagne' },
    
    // Add-on Services
    { id: '4', name: 'Professional Bartender', price: 350, category: 'Add-on Services', type: 'quantity', selected: true, quantity: 2 },
    { id: '5', name: 'Cocktail Station Setup', price: 175, category: 'Add-on Services', type: 'multiple', selected: true, quantity: 1 },
    { id: '6', name: 'Ice & Glassware Service', price: 125, category: 'Add-on Services', type: 'multiple', selected: true, quantity: 1 },
    
    // Premium Spirits
    { id: '7', name: 'Top Shelf Vodka Selection', price: 85, category: 'Premium Spirits', type: 'multiple', selected: false, quantity: 1 },
    { id: '8', name: 'Craft Whiskey Collection', price: 120, category: 'Premium Spirits', type: 'multiple', selected: true, quantity: 1 },
    { id: '9', name: 'Imported Gin Varieties', price: 95, category: 'Premium Spirits', type: 'multiple', selected: false, quantity: 1 },
    
    // Special Requests
    { id: '10', name: 'Signature Cocktail Creation', price: 150, category: 'Special Requests', type: 'quantity', selected: true, quantity: 2 },
    { id: '11', name: 'Wine Pairing Consultation', price: 200, category: 'Special Requests', type: 'multiple', selected: false, quantity: 1 },
  ]);

  const categories = [...new Set(items.map(item => item.category))];

  const handlePackageChange = (packageType: string) => {
    setSelectedPackage(packageType);
    // Update items based on package selection
    setItems(prev => prev.map(item => {
      if (item.category === 'Beverage Packages') {
        return { ...item, selected: item.name.toLowerCase().includes(packageType) };
      }
      return item;
    }));
  };

  const handleItemToggle = (itemId: string, checked: boolean) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, selected: checked } : item
    ));
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item
    ));
  };

  const calculateTotals = () => {
    const selectedItems = items.filter(item => item.selected);
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tip = (subtotal * tipPercentage) / 100;
    const tax = subtotal * 0.0875; // 8.75% tax
    const total = subtotal + tip + tax;
    
    return { subtotal, tip, tax, total, selectedItems };
  };

  const totals = calculateTotals();

  const handleGenerateQuote = () => {
    const quoteData = {
      eventType,
      package: selectedPackage,
      items: totals.selectedItems,
      tipPercentage,
      totals,
      generatedAt: new Date().toISOString()
    };
    
    onGenerateQuote?.(totals.selectedItems, totals);
    toast.success('Quote generated successfully!');
  };

  const handleGenerateInvoice = () => {
    toast.success('Invoice generation started - you will receive it via email shortly.');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">{eventType} Quote Builder</CardTitle>
              <p className="text-muted-foreground">Configure your perfect beverage service package</p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {totals.selectedItems.length} items selected
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Package Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Beverage Package Selection</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={selectedPackage} onValueChange={handlePackageChange}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {items.filter(item => item.category === 'Beverage Packages').map(item => (
                <div key={item.id} className="border rounded-lg p-4 hover:border-primary">
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem 
                      value={item.name.toLowerCase().split(' ')[0]} 
                      id={item.id}
                    />
                    <Label htmlFor={item.id} className="font-medium">{item.name}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  <p className="font-bold text-lg">${item.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Category Items */}
      {categories.filter(cat => cat !== 'Beverage Packages').map(category => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {category}
              <Badge variant="outline">
                {items.filter(item => item.category === category && item.selected).length} selected
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.filter(item => item.category === category).map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={item.selected}
                      onCheckedChange={(checked) => handleItemToggle(item.id, !!checked)}
                    />
                    <div>
                      <Label className="font-medium">{item.name}</Label>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {item.type === 'quantity' && (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(item.id, -1)}
                          disabled={item.quantity <= 0}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleQuantityChange(item.id, 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    
                    <div className="text-right">
                      <p className="font-medium">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-muted-foreground">
                          ${item.price} each
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Tip Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Service Tip</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={tipPercentage.toString()} onValueChange={(value) => setTipPercentage(Number(value))}>
            <div className="grid grid-cols-4 gap-4">
              {[15, 18, 20, 25].map(tip => (
                <div key={tip} className="flex items-center space-x-2">
                  <RadioGroupItem value={tip.toString()} id={`tip-${tip}`} />
                  <Label htmlFor={`tip-${tip}`}>{tip}%</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Quote Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Tip ({tipPercentage}%):</span>
              <span>${totals.tip.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (8.75%):</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex gap-4 mt-6">
            <Button onClick={handleGenerateQuote} className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Accept Quote
            </Button>
            <Button onClick={handleGenerateInvoice} variant="outline" className="flex-1">
              <DollarSign className="w-4 h-4 mr-2" />
              Generate Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};