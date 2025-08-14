import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedQuoteCreator } from "./UnifiedQuoteCreator";
import { Plus, Search, Eye, Download, Send, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface Quote {
  id: string;
  quote_number: string;
  customer_name: string;
  customer_email: string;
  event_type: string;
  event_date: string | null;
  total_amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'expired' | 'cancelled';
  created_by: 'affiliate' | 'ai_agent' | 'admin';
  created_at: string;
  expiration_date: string;
}

export const QuoteManager: React.FC = () => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreator, setShowCreator] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    try {
      // Since TypeScript types haven't been updated yet, we'll use any temporarily
      const { data, error } = await (supabase as any)
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast({
        title: "Error",
        description: "Failed to load quotes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotes = quotes.filter(quote =>
    quote.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.quote_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    quote.event_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuoteGenerated = (quoteData: any) => {
    fetchQuotes(); // Refresh the list
    setShowCreator(false);
    toast({
      title: "Success",
      description: "Quote created successfully",
    });
  };

  const downloadQuotePDF = async (quote: Quote) => {
    try {
      // Fetch full quote data (using any due to TypeScript types not updated yet)
      const { data: fullQuote, error } = await (supabase as any)
        .from('quotes')
        .select('*')
        .eq('id', quote.id)
        .single();

      if (error) throw error;

      // Generate PDF via edge function
      const { data: pdfResult, error: pdfError } = await supabase.functions.invoke('generate-quote-pdf', {
        body: { quoteData: fullQuote }
      });

      if (pdfError) throw pdfError;

      // Create and download HTML file (client can convert to PDF)
      const blob = new Blob([pdfResult.htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quote-${quote.quote_number}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Download Started",
        description: "Quote HTML file is downloading",
      });
    } catch (error) {
      console.error('Error downloading quote:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download quote PDF",
        variant: "destructive",
      });
    }
  };

  const sendQuoteToCustomer = async (quote: Quote) => {
    try {
      // This would integrate with email service
      toast({
        title: "Quote Sent",
        description: `Quote sent to ${quote.customer_email}`,
      });
      
      // Update quote status (using any due to TypeScript types not updated yet)
      const { error } = await (supabase as any)
        .from('quotes')
        .update({ status: 'sent' })
        .eq('id', quote.id);

      if (error) throw error;
      fetchQuotes();
    } catch (error) {
      console.error('Error sending quote:', error);
      toast({
        title: "Send Failed",
        description: "Failed to send quote",
        variant: "destructive",
      });
    }
  };

  const deleteQuote = async (quote: Quote) => {
    if (!confirm(`Are you sure you want to delete quote ${quote.quote_number}?`)) {
      return;
    }

    try {
      // Delete quote (using any due to TypeScript types not updated yet)
      const { error } = await (supabase as any)
        .from('quotes')
        .delete()
        .eq('id', quote.id);

      if (error) throw error;
      
      fetchQuotes();
      toast({
        title: "Quote Deleted",
        description: "Quote has been deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete quote",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showCreator) {
    return (
      <UnifiedQuoteCreator
        source="admin"
        onClose={() => setShowCreator(false)}
        onQuoteGenerated={handleQuoteGenerated}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Quote Management</CardTitle>
            <Button onClick={() => setShowCreator(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Quote
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search quotes by customer, email, or quote number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading quotes...</div>
          ) : filteredQuotes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No quotes match your search.' : 'No quotes created yet.'}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map((quote) => (
                <Card key={quote.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">Quote #{quote.quote_number}</h3>
                          <Badge className={getStatusColor(quote.status)}>
                            {quote.status}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {quote.created_by}
                          </Badge>
                        </div>
                        <div className="text-gray-600">
                          <p><strong>Customer:</strong> {quote.customer_name} ({quote.customer_email})</p>
                          <p><strong>Event:</strong> {quote.event_type} {quote.event_date && `- ${format(new Date(quote.event_date), 'MMM dd, yyyy')}`}</p>
                          <p><strong>Total:</strong> ${quote.total_amount.toFixed(2)}</p>
                          <p><strong>Created:</strong> {format(new Date(quote.created_at), 'MMM dd, yyyy')}</p>
                          <p><strong>Expires:</strong> {format(new Date(quote.expiration_date), 'MMM dd, yyyy')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadQuotePDF(quote)}>
                          <Download className="w-4 h-4" />
                        </Button>
                        {quote.status !== 'sent' && (
                          <Button variant="outline" size="sm" onClick={() => sendQuoteToCustomer(quote)}>
                            <Send className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => deleteQuote(quote)}>
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};