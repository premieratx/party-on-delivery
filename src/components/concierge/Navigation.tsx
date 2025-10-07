import { Home, Calendar, ShoppingCart, Car, Ship, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useScrollToHideNav } from '@/hooks/useScrollToHideNav';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Calendar, label: 'Itinerary', path: '/itinerary' },
  { icon: ShoppingCart, label: 'Delivery', path: '/app/delivery' },
  { icon: Car, label: 'Transport', path: '/transport' },
  { icon: Ship, label: 'Boats', path: '/boats' },
  { icon: MapPin, label: 'Explore', path: '/explore' },
];

interface NavigationProps {
  hideOnScroll?: boolean;
}

export function Navigation({ hideOnScroll = false }: NavigationProps) {
  const location = useLocation();
  const isVisible = useScrollToHideNav(50);
  const shouldShow = !hideOnScroll || isVisible;

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 backdrop-blur-md border-t border-white/20 z-50 shadow-2xl transition-transform duration-300",
      shouldShow ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-2 sm:px-3 rounded-lg transition-all duration-300 relative min-w-0 flex-1",
                isActive
                  ? "text-white bg-white/20 shadow-lg scale-105"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className={cn(
                "h-4 w-4 sm:h-5 sm:w-5 mb-1 flex-shrink-0 transition-all duration-300",
                isActive && "drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
              )} />
              <span className={cn(
                "text-xs font-medium text-center line-clamp-1",
                isActive && "font-bold"
              )}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
