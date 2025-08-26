import React from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check } from 'lucide-react';

interface MobileBottomCartBarProps {
  cartItemCount: number;
  totalAmount?: number;
  className?: string;
  onOpenCart: () => void;
  onCheckout?: () => void;
}

export const MobileBottomCartBar: React.FC<MobileBottomCartBarProps> = ({
  cartItemCount,
  totalAmount,
  className = '',
  onOpenCart,
  onCheckout
}) => {
  
  // Always hidden on mobile - navigation moved to swipe-up component
  return null;
};