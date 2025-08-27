import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShoppingCart, CreditCard, Search, Package } from 'lucide-react';
import { UnifiedCartItem } from '@/hooks/useUnifiedCart';
import { DeliveryAppSelector } from '@/components/delivery/DeliveryAppSelector';
import { safeNumber, formatPrice, calculateTotal, calculateTotalItems } from '@/utils/safeCalculations';
import { withCartErrorBoundary } from './RobustCartErrorBoundary';

interface BottomCartBarProps {
  items: UnifiedCartItem[];
  totalPrice: number;
  isVisible: boolean;
  onOpenCart: () => void;
  onCheckout: () => void;
  shouldHide?: boolean;
  showAdmin?: boolean;
  currentAppSlug?: string;
}

export const BottomCartBar = withCartErrorBoundary<BottomCartBarProps>(({
  items,
  totalPrice,
  isVisible,
  onOpenCart,
  onCheckout,
  shouldHide = false,
  showAdmin = false,
  currentAppSlug
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = calculateTotalItems(items);
  
  // Apply affiliate/delivery-app markup with bulletproof calculations
  const markupPercent = safeNumber(sessionStorage.getItem('pricing.markupPercent'));
  const applyMarkup = (price: number) => {
    const safePrice = safeNumber(price);
    return safePrice * (1 + markupPercent / 100);
  };
  
  // ROBUST total calculation that can never crash the website
  const adjustedTotal = items.reduce((sum, item) => {
    const safePrice = safeNumber(item.price);
    const safeQuantity = safeNumber(item.quantity);
    return sum + applyMarkup(safePrice) * safeQuantity;
  }, 0);

  // Helper to check if we're on the homepage - avoid reloading if already there
  const isHomePage = location.pathname === '/';

  // Always show the bottom cart bar - never hide it completely
  // This ensures consistent sticky behavior across desktop and mobile

  // COMPLETELY DISABLED - Bottom navigation removed as requested
  // All functionality moved to top navigation
  return null;
});