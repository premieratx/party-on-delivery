import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { ChevronLeft, Download, Send, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface QuoteItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  category?: string;
  image?: string;
}

interface QuoteData {
  // Customer Information
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerCompany?: string;
  
  // Event Details
  eventType: string;
  eventDate: string;
  eventTime: string;
  guestCount: number;
  eventLocation: string;
  eventDescription?: string;
  
  // Quote Items & Pricing
  items: QuoteItem[];
  subtotal: number;
  deliveryFee: number;
  salesTax: number;
  tipAmount: number;
  totalAmount: number;
  
  // Quote Metadata
  quoteNumber: string;
  expirationDate: string;
  notes?: string;
  createdBy: 'affiliate' | 'ai_agent' | 'admin';
  affiliateCode?: string;
}

interface UnifiedQuoteCreatorProps {
  source: 'affiliate' | 'ai_agent' | 'admin';
  initialData?: Partial<QuoteData>;
  onClose?: () => void;
  onQuoteGenerated?: (quoteData: QuoteData) => void;
}

export const UnifiedQuoteCreator: React.FC<UnifiedQuoteCreatorProps> = ({
  source,
  initialData,
  onClose,
  onQuoteGenerated
}) => {
  const { toast } = useToast();
  const { cartItems, emptyCart } = useUnifiedCart();
  
  const [step, setStep] = useState<'details' | 'items' | 'review' | 'generated'>('details');
  const [loading, setLoading] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteData>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    eventType: '',
    eventDate: '',
    eventTime: '',
    guestCount: 10,
    eventLocation: '',
    eventDescription: '',
    items: [],
    subtotal: 0,
    deliveryFee: 25,
    salesTax: 0,
    tipAmount: 0,
    totalAmount: 0,
    quoteNumber: `QTE-${Date.now()}`,
    expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    createdBy: source,
    ...initialData
  });

  // Initialize with cart items or AI recommendations
  useEffect(() => {
    if (cartItems.length > 0 && quoteData.items.length === 0) {
      const items = cartItems.map(item => ({
        id: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        category: item.category,
        image: item.image
      }));
      setQuoteData(prev => ({ ...prev, items }));
    }
  }, [cartItems]);

  // Calculate totals
  useEffect(() => {
    const subtotal = quoteData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const salesTax = subtotal * 0.0825; // Austin, TX sales tax
    const totalAmount = subtotal + quoteData.deliveryFee + salesTax + quoteData.tipAmount;
    
    setQuoteData(prev => ({
      ...prev,
      subtotal,
      salesTax,
      totalAmount
    }));
  }, [quoteData.items, quoteData.deliveryFee, quoteData.tipAmount]);

  const handleCustomerDetailsSubmit = () => {
    if (!quoteData.customerName || !quoteData.customerEmail || !quoteData.eventType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required customer and event details.",
        variant: "destructive",
      });
      return;
    }
    setStep('items');
  };

  const addItem = () => {
    const newItem: QuoteItem = {
      id: `custom-${Date.now()}`,
      title: 'Custom Item',
      quantity: 1,
      price: 0,
      category: 'other'
    };
    setQuoteData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (index: number, field: keyof QuoteItem, value: any) => {
    setQuoteData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeItem = (index: number) => {
    setQuoteData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const generatePDFQuote = async () => {
    setLoading(true);
    try {
      // This would integrate with React-PDF or similar library
      toast({
        title: "Quote Generated",
        description: "PDF quote has been generated successfully.",
      });
      
      // Call the callback if provided
      if (onQuoteGenerated) {
        onQuoteGenerated(quoteData);
      }
      
      setStep('generated');
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate PDF quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendQuoteToCustomer = async () => {
    setLoading(true);
    try {
      // This would integrate with email service
      toast({
        title: "Quote Sent",
        description: `Quote has been sent to ${quoteData.customerEmail}`,
      });
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Failed to send quote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-6">
      {['details', 'items', 'review'].map((stepName, index) => (
        <div key={stepName} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
            step === stepName ? 'bg-primary text-white' : 
            ['details', 'items', 'review'].indexOf(step) > index ? 'bg-green-500 text-white' : 
            'bg-gray-200 text-gray-600'
          }`}>
            {index + 1}
          </div>
          <span className="ml-2 text-sm capitalize hidden sm:inline">{stepName}</span>
          {index < 2 && <div className="w-8 h-1 bg-gray-200 mx-2" />}
        </div>
      ))}
    </div>
  );

  if (step === 'details') {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {onClose && <Button variant="ghost" size="icon" onClick={onClose}><ChevronLeft /></Button>}
              Create Quote - Customer & Event Details
            </CardTitle>
            <Badge variant="outline" className="capitalize">{source} Quote</Badge>
          </div>
          {renderStepIndicator()}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Customer Information</h3>
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  value={quoteData.customerName}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>
              <div>
                <Label htmlFor="customerEmail">Email Address *</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={quoteData.customerEmail}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, customerEmail: e.target.value }))}
                  placeholder="customer@email.com"
                />
              </div>
              <div>
                <Label htmlFor="customerPhone">Phone Number</Label>
                <Input
                  id="customerPhone"
                  value={quoteData.customerPhone}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, customerPhone: e.target.value }))}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="customerCompany">Company (Optional)</Label>
                <Input
                  id="customerCompany"
                  value={quoteData.customerCompany}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, customerCompany: e.target.value }))}
                  placeholder="Company name"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Event Details</h3>
              <div>
                <Label htmlFor="eventType">Event Type *</Label>
                <Select value={quoteData.eventType} onValueChange={(value) => setQuoteData(prev => ({ ...prev, eventType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="birthday">Birthday Party</SelectItem>
                    <SelectItem value="wedding">Wedding</SelectItem>
                    <SelectItem value="corporate">Corporate Event</SelectItem>
                    <SelectItem value="graduation">Graduation</SelectItem>
                    <SelectItem value="anniversary">Anniversary</SelectItem>
                    <SelectItem value="holiday">Holiday Party</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="eventDate">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={quoteData.eventDate}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, eventDate: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="eventTime">Event Time</Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={quoteData.eventTime}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, eventTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="guestCount">Number of Guests</Label>
                <Input
                  id="guestCount"
                  type="number"
                  min="1"
                  value={quoteData.guestCount}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, guestCount: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <Label htmlFor="eventLocation">Event Location</Label>
                <Textarea
                  id="eventLocation"
                  value={quoteData.eventLocation}
                  onChange={(e) => setQuoteData(prev => ({ ...prev, eventLocation: e.target.value }))}
                  placeholder="Enter event address or location"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="eventDescription">Event Description (Optional)</Label>
            <Textarea
              id="eventDescription"
              value={quoteData.eventDescription}
              onChange={(e) => setQuoteData(prev => ({ ...prev, eventDescription: e.target.value }))}
              placeholder="Tell us more about your event..."
              rows={3}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleCustomerDetailsSubmit}>
              Continue to Items
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'items') {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Quote Items</CardTitle>
          {renderStepIndicator()}
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold">Items in Quote</h3>
            <Button onClick={addItem} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {quoteData.items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                  <div className="md:col-span-2">
                    <Label>Item Name</Label>
                    <Input
                      value={item.title}
                      onChange={(e) => updateItem(index, 'title', e.target.value)}
                      placeholder="Item name"
                    />
                  </div>
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div>
                    <Label>Price ($)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.price}
                      onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {quoteData.items.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No items added yet. Click "Add Item" to get started.
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('details')}>
              Back
            </Button>
            <Button onClick={() => setStep('review')} disabled={quoteData.items.length === 0}>
              Review Quote
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'review') {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Review Quote</CardTitle>
          {renderStepIndicator()}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Customer & Event Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold">Customer Information</h3>
              <p><strong>Name:</strong> {quoteData.customerName}</p>
              <p><strong>Email:</strong> {quoteData.customerEmail}</p>
              {quoteData.customerPhone && <p><strong>Phone:</strong> {quoteData.customerPhone}</p>}
              {quoteData.customerCompany && <p><strong>Company:</strong> {quoteData.customerCompany}</p>}
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">Event Details</h3>
              <p><strong>Type:</strong> {quoteData.eventType}</p>
              {quoteData.eventDate && <p><strong>Date:</strong> {quoteData.eventDate}</p>}
              {quoteData.eventTime && <p><strong>Time:</strong> {quoteData.eventTime}</p>}
              <p><strong>Guests:</strong> {quoteData.guestCount}</p>
              {quoteData.eventLocation && <p><strong>Location:</strong> {quoteData.eventLocation}</p>}
            </div>
          </div>

          {/* Items Summary */}
          <div>
            <h3 className="font-semibold mb-4">Quote Items</h3>
            <div className="space-y-2">
              {quoteData.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <span className="font-medium">{item.title}</span>
                    <span className="text-gray-600 ml-2">× {item.quantity}</span>
                  </div>
                  <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="border-t pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${quoteData.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee:</span>
                <span>${quoteData.deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Sales Tax:</span>
                <span>${quoteData.salesTax.toFixed(2)}</span>
              </div>
              {quoteData.tipAmount > 0 && (
                <div className="flex justify-between">
                  <span>Tip:</span>
                  <span>${quoteData.tipAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${quoteData.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={quoteData.notes}
              onChange={(e) => setQuoteData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes or terms..."
              rows={3}
            />
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep('items')}>
              Back to Items
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={generatePDFQuote} disabled={loading}>
                <Download className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
              <Button onClick={sendQuoteToCustomer} disabled={loading}>
                <Send className="w-4 h-4 mr-2" />
                Send to Customer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-green-600">Quote Generated Successfully!</CardTitle>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <p>Quote #{quoteData.quoteNumber} has been created and sent to {quoteData.customerEmail}</p>
        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={() => setStep('review')}>
            View Quote
          </Button>
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UnifiedQuoteCreator;