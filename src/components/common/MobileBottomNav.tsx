import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Search, Settings, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface MobileBottomNavProps {
  cartItemCount?: number;
  onOpenCart?: () => void;
  onOpenDeliverySelector?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  cartItemCount = 0,
  onOpenCart,
  onOpenDeliverySelector
}) => {
  const navigate = useNavigate();

  // Navigation moved to swipe-up component - always hidden
  return null;
};