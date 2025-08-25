import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
import { useCoverPageDetection } from '@/hooks/useCoverPageDetection';
import { 
  Home, 
  ShoppingCart, 
  Users, 
  User, 
  Settings, 
  Menu,
  Search,
  Package,
  TrendingUp,
  Gift,
  Phone,
  X,
  ChevronRight
} from 'lucide-react';
import { DeliveryAppDropdown } from '@/components/admin/DeliveryAppDropdown';

interface NavigationProps {
  className?: string;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
  show: 'always' | 'authenticated' | 'admin' | 'affiliate' | 'customer';
  category: 'main' | 'user' | 'admin' | 'affiliate';
}

const navigationItems: NavItem[] = [
  // Main navigation
  { icon: Home, label: 'Home', href: '/', show: 'always', category: 'main' },
  
  // User accounts
  { icon: User, label: 'Manage My Order', href: '/customer/auth?redirect=dashboard', show: 'always', category: 'user' },
  { icon: TrendingUp, label: 'Affiliate Program', href: '/affiliate', show: 'always', category: 'affiliate' },
  { icon: User, label: 'My Dashboard', href: '/customer/dashboard', show: 'customer', category: 'user' },
  { icon: TrendingUp, label: 'Affiliate Dashboard', href: '/affiliate/dashboard', show: 'affiliate', category: 'affiliate' },
  
  // Admin
  { icon: Settings, label: 'Admin Panel', href: '/admin', show: 'admin', category: 'admin' },
  { icon: Search, label: 'Search Products', href: '/search', show: 'admin', category: 'admin' },
  { icon: Package, label: 'Product Management', href: '/admin/product-management', show: 'admin', category: 'admin' },
  { icon: Users, label: 'Group Orders', href: '/group', show: 'admin', category: 'admin' },
  // { icon: Gift, label: 'Party Planner', href: '/plan-my-party', show: 'admin', category: 'admin' }, // removed
];

export const GlobalNavigation: React.FC<NavigationProps> = ({ className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userType, setUserType] = useState<'guest' | 'customer' | 'affiliate' | 'admin'>('guest');
  const [showNavigation, setShowNavigation] = useState(true);
  const { getTotalItems, getTotalPrice } = useUnifiedCart();
  const { isCoverPage } = useCoverPageDetection();
  
  console.log('🧭 GlobalNavigation render:', { isCoverPage, pathname: location.pathname });
  useEffect(() => {
    console.log('🔍 Navigation check for path:', location.pathname);
    console.log('🔍 isCoverPage:', isCoverPage);
    
    if (isCoverPage) {
      console.log('❌ Hiding navigation - cover page detected');
      setShowNavigation(false);
      return;
    }
    
    const hideNavOnRoutes = ['/checkout', '/order-complete', '/success'];
    const shouldHideBasedOnRoute = hideNavOnRoutes.some(route => location.pathname.startsWith(route));
    
    if (shouldHideBasedOnRoute) {
      console.log('❌ Hiding navigation - matches hideNavOnRoutes');
      setShowNavigation(false);
      return;
    }
    
    console.log('✅ Showing navigation for path:', location.pathname);
    setShowNavigation(true);
  }, [location.pathname, isCoverPage]);

  // Detect user type from URL and localStorage
  useEffect(() => {
    const path = location.pathname;
    if (path.startsWith('/admin')) {
      setUserType('admin');
    } else if (path.startsWith('/affiliate') && path !== '/affiliate') {
      setUserType('affiliate');
    } else if (path.startsWith('/customer') && path !== '/customer/login') {
      setUserType('customer');
    } else {
      setUserType('guest');
    }
  }, [location.pathname]);

  // Filter navigation items based on user type
  const getVisibleItems = (category: string) => {
    return navigationItems
      .filter(item => item.category === category)
      .filter(item => {
        switch (item.show) {
          case 'always':
            return true;
          case 'authenticated':
            return userType !== 'guest';
          case 'admin':
            return userType === 'admin';
          case 'affiliate':
            return userType === 'affiliate';
          case 'customer':
            return userType === 'customer';
          default:
            return true;
        }
      });
  };

  const handleNavigation = (href: string) => {
    if (href === '/') {
      const override = sessionStorage.getItem('home-override');
      if (override) {
        navigate(override);
        setIsOpen(false);
        return;
      }
    }
    navigate(href);
    setIsOpen(false);
  };

  // Cart summary for mobile
  const cartItems = getTotalItems();
  const cartTotal = getTotalPrice();

  // For cover pages, render aggressive CSS to hide ALL navigation
  if (!showNavigation || isCoverPage) {
    console.log('🚫 GlobalNavigation: Not rendering - cover page or hidden navigation');
    return (
      <>
        <style>
          {`
            /* AGGRESSIVE: Hide ALL possible navigation elements */
            .fixed.bottom-0,
            .fixed.top-0,
            [data-bottom-nav],
            [data-cart-trigger],
            .bottom-navigation,
            .mobile-bottom-nav,
            .global-cart-provider,
            .global-cart-provider *,
            nav,
            header,
            .bottom-cart-bar,
            [class*="bottom"],
            [class*="nav"],
            [class*="cart"] {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              pointer-events: none !important;
              position: absolute !important;
              top: -9999px !important;
              left: -9999px !important;
            }
            
            /* Ensure main content takes full height */
            body, html, #root {
              margin: 0 !important;
              padding: 0 !important;
            }
          `}
        </style>
        <div style={{ display: 'none' }} />
      </>
    );
  }

  return (
    <>
      {/* Mobile Bottom Navigation Bar - HIDDEN */}
      <div className="hidden">{/* Bottom nav bar hidden on mobile as requested */}
        <div className="grid grid-cols-4 h-12">
          {/* Cart */}
          <button
            onClick={() => {
              const cartTrigger = document.querySelector('[data-cart-trigger]') as HTMLElement;
              cartTrigger?.click();
            }}
            className="flex flex-col items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors relative px-1"
          >
            <span className="font-medium">Cart</span>
            {cartItems > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 text-[8px] rounded-full p-0 flex items-center justify-center"
              >
                {cartItems}
              </Badge>
            )}
          </button>

          {/* Checkout */}
          <button
            onClick={() => {
              if (cartItems > 0) {
                handleNavigation('/checkout');
              } else {
                const cartTrigger = document.querySelector('[data-cart-trigger]') as HTMLElement;
                cartTrigger?.click();
              }
            }}
            className="flex flex-col items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors relative px-1"
          >
            <span className="font-medium">{cartItems > 0 ? 'Checkout' : 'Cart'}</span>
            {cartItems > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-4 w-4 text-[8px] rounded-full p-0 flex items-center justify-center"
              >
                {cartItems}
              </Badge>
            )}
          </button>

          {/* Admin Dashboard */}
          <button
            onClick={() => handleNavigation('/admin')}
            className={`flex flex-col items-center justify-center text-xs transition-colors px-1 ${
              location.pathname === '/admin' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="font-medium">Admin</span>
          </button>

          {/* More Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors px-1">
                <span className="font-medium">More</span>
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Menu</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Cart Summary */}
                {cartItems > 0 && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <h4 className="font-medium mb-2">Your Cart</h4>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">{cartItems} items</span>
                      <span className="font-semibold">${cartTotal.toFixed(2)}</span>
                    </div>
                    <Button 
                      onClick={() => {
                        const cartTrigger = document.querySelector('[data-cart-trigger]') as HTMLElement;
                        cartTrigger?.click();
                        setIsOpen(false);
                      }}
                      className="w-full mt-3"
                      size="sm"
                    >
                      View Cart
                    </Button>
                  </div>
                )}

                {/* Main Navigation */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Quick Actions
                  </h4>
                  <div className="space-y-1">
                    {getVisibleItems('main').map((item) => (
                      <button
                        key={item.href}
                        onClick={() => handleNavigation(item.href)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                          location.pathname === item.href
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="font-medium">{item.label}</span>
                        <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* User Navigation */}
                {getVisibleItems('user').length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Account
                    </h4>
                    <div className="space-y-1">
                      {getVisibleItems('user').map((item) => (
                        <button
                          key={item.href}
                          onClick={() => handleNavigation(item.href)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            location.pathname === item.href
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="font-medium">{item.label}</span>
                          <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Affiliate Navigation */}
                {getVisibleItems('affiliate').length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Affiliate
                    </h4>
                    <div className="space-y-1">
                      {getVisibleItems('affiliate').map((item) => (
                        <button
                          key={item.href}
                          onClick={() => handleNavigation(item.href)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            location.pathname === item.href
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="font-medium">{item.label}</span>
                          <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Navigation */}
                {getVisibleItems('admin').length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                      Admin
                    </h4>
                    <div className="space-y-1">
                      {getVisibleItems('admin').map((item) => (
                        <button
                          key={item.href}
                          onClick={() => handleNavigation(item.href)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${
                            location.pathname === item.href
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-muted/50'
                          }`}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="font-medium">{item.label}</span>
                          <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Support */}
                <div className="pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => window.open('tel:+15127778888')}
                    className="w-full justify-start gap-3"
                  >
                    <Phone className="h-4 w-4" />
                    Call Support
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Desktop Navigation - Simple top bar (non-sticky) */}
      <div className="hidden md:block bg-background/95 backdrop-blur-md border-b border-border/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <button
                onClick={() => handleNavigation('/')}
                className="font-bold text-xl text-primary"
              >
                Party On Delivery
              </button>
              
              <nav className="flex items-center gap-4">
                {getVisibleItems('main').slice(0, 3).map((item) => (
                  <Button
                    key={item.href}
                    variant={location.pathname === item.href ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => handleNavigation(item.href)}
                    className="gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                ))}
                
                {/* Delivery App Dropdown */}
                <DeliveryAppDropdown />
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation('/customer/auth?redirect=dashboard')}
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Manage My Order
              </Button>
            </div>
          </div>
        </div>
      </div>

    </>
  );
};
