import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FormalQuoteView } from '@/components/quote/FormalQuoteView';
import { toast } from 'sonner';

export default function FormalQuote() {
  const [searchParams] = useSearchParams();
  const [quoteData, setQuoteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const quoteParam = searchParams.get('quote');
    
    if (quoteParam) {
      try {
        const data = JSON.parse(decodeURIComponent(quoteParam));
        setQuoteData(data);
      } catch (error) {
        console.error('Failed to parse quote data:', error);
        toast.error('Failed to load quote data');
      }
    }
    setLoading(false);
  }, [searchParams]);

  const handlePayDeposit = () => {
    toast.info('Deposit payment functionality will be implemented with Stripe integration');
  };

  const handlePayFull = () => {
    toast.info('Full payment functionality will be implemented with Stripe integration');
  };

  const handleProceedToCheckout = () => {
    window.location.href = '/checkout';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Loading Quote...</h2>
          <p className="text-muted-foreground">Please wait while we load your formal quote.</p>
        </div>
      </div>
    );
  }

  if (!quoteData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Quote Not Found</h2>
          <p className="text-muted-foreground">The requested quote could not be loaded.</p>
        </div>
      </div>
    );
  }

  return (
    <FormalQuoteView
      quote={quoteData}
      onPayDeposit={handlePayDeposit}
      onPayFull={handlePayFull}
      onProceedToCheckout={handleProceedToCheckout}
    />
  );
}