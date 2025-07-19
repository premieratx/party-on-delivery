import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe('pk_live_51P5K9v07pCJBpBSWlYkOr6p0O2KfQcR3p3mG5VPl4zQPF8l7Kp8VYw4d3LQZ5k8J9vQE6q1wC2xF3rR7mK8Q4v9L6tY0q1nE4sN');

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