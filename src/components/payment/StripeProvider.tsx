import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51RmgBQBU499hGMnl9iCfgbBbz5FPOphDpnHc2LezgCsTxxmu5IDP3hRVRfAlzOyj4RGucpB20Y4amsnf6ASqu4HT00PnkTlpoQ');

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