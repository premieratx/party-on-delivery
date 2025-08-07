import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUnifiedCart } from '@/hooks/useUnifiedCart';
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
  { icon: Search, label: 'Search Products', href: '/search', show: 'always', category: 'main' },
  { icon: Package, label: 'Main Delivery', href: '/main-delivery-app', show: 'always', category: 'main' },
  
  // User accounts
  { icon: User, label: 'Customer Login', href: '/customer/login', show: 'always', category: 'user' },
  { icon: TrendingUp, label: 'Affiliate Program', href: '/affiliate', show: 'always', category: 'affiliate' },
  { icon: User, label: 'My Dashboard', href: '/customer/dashboard', show: 'customer', category: 'user' },
  { icon: TrendingUp, label: 'Affiliate Dashboard', href: '/affiliate/dashboard', show: 'affiliate', category: 'affiliate' },
  
  // Admin
  { icon: Settings, label: 'Admin Panel', href: '/admin', show: 'admin', category: 'admin' },
  { icon: Package, label: 'Product Management', href: '/admin/product-management', show: 'admin', category: 'admin' },
  { icon: Settings, label: 'Delivery Apps', href: '/admin/delivery-app-manager', show: 'admin', category: 'admin' },
  { icon: Users, label: 'Group Orders', href: '/group', show: 'admin', category: 'admin' },
  { icon: Gift, label: 'Party Planner', href: '/plan-my-party', show: 'admin', category: 'admin' },
];

export const GlobalNavigation: React.FC<NavigationProps> = ({ className }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [userType, setUserType] = useState<'guest' | 'customer' | 'affiliate' | 'admin'>('guest');
  const [showNavigation, setShowNavigation] = useState(true);
  const { getTotalItems, getTotalPrice } = useUnifiedCart();

  // Check if current route should show navigation
  useEffect(() => {
    const hideNavOnRoutes = ['/checkout', '/order-complete', '/success'];
    const shouldShow = !hideNavOnRoutes.some(route => location.pathname.startsWith(route));
    setShowNavigation(shouldShow);
  }, [location.pathname]);

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
    navigate(href);
    setIsOpen(false);
  };

  // Cart summary for mobile
  const cartItems = getTotalItems();
  const cartTotal = getTotalPrice();

  if (!showNavigation) {
    return null;
  }

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/20 md:hidden">
        <div className="grid grid-cols-5 h-14">
          {/* Home */}
          <button
            onClick={() => handleNavigation('/')}
            className={`flex flex-col items-center justify-center text-xs transition-colors ${
              location.pathname === '/' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className="h-4 w-4 mb-1" />
            <span>Home</span>
          </button>

          {/* Search */}
          <button
            onClick={() => handleNavigation('/search')}
            className={`flex flex-col items-center justify-center text-xs transition-colors ${
              location.pathname === '/search' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Search className="h-4 w-4 mb-1" />
            <span>Search</span>
          </button>

          {/* Delivery Apps */}
          <button
            onClick={() => handleNavigation('/main-delivery-app')}
            className={`flex flex-col items-center justify-center text-xs transition-colors ${
              location.pathname === '/main-delivery-app' 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="h-4 w-4 mb-1" />
            <span>Delivery</span>
          </button>

          {/* Cart with Checkout */}
          <button
            onClick={() => {
              if (cartItems > 0) {
                handleNavigation('/checkout');
              } else {
                const cartTrigger = document.querySelector('[data-cart-trigger]') as HTMLElement;
                cartTrigger?.click();
              }
            }}
            className="flex flex-col items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors relative"
          >
            <ShoppingCart className="h-4 w-4 mb-1" />
            <span>{cartItems > 0 ? 'Checkout' : 'Cart'}</span>
            {cartItems > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 text-[10px] rounded-full p-0 flex items-center justify-center"
              >
                {cartItems}
              </Badge>
            )}
          </button>

          {/* More Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <button className="flex flex-col items-center justify-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                <Menu className="h-4 w-4 mb-1" />
                <span>More</span>
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

      {/* Desktop Navigation - Simple top bar */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/20">
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
                {getVisibleItems('main').filter(item => item.label !== 'Main Delivery').slice(0, 3).map((item) => (
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
              {/* Cart with Checkout */}
              <Button
                variant={cartItems > 0 ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (cartItems > 0) {
                    handleNavigation('/checkout');
                  } else {
                    const cartTrigger = document.querySelector('[data-cart-trigger]') as HTMLElement;
                    cartTrigger?.click();
                  }
                }}
                className="relative gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                {cartItems > 0 ? 'Checkout' : 'Cart'}
                {cartItems > 0 && (
                  <Badge variant={cartItems > 0 ? "secondary" : "destructive"} className="ml-1">
                    {cartItems}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop spacing */}
      <div className="hidden md:block h-16" />
    </>
  );
};
