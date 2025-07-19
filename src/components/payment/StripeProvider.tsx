import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_live_51P5K9v07pCJBpBSWdT4rHYDnmXCFYUxGSjb8oIrfUeRKbOjOdvJXpzl5BFQJ3T6k3Xyh6kkQvBXdQJ6t4Q9rKxXg00x0lM7vCH');

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};