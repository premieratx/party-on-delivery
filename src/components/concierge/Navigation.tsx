import { Home, Calendar, ShoppingCart, Car, Ship, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Calendar, label: 'Itinerary', path: '/itinerary' },
  { icon: ShoppingCart, label: 'Delivery', path: '/app/delivery' },
  { icon: Car, label: 'Transport', path: '/transport' },
  { icon: Ship, label: 'Boats', path: '/boats' },
  { icon: MapPin, label: 'Explore', path: '/explore' },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border z-50">
      <div className="flex items-center justify-around py-2 px-1 max-w-lg mx-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');

          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-2 sm:px-3 rounded-lg transition-colors relative min-w-0 flex-1",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="h-4 w-4 sm:h-5 sm:w-5 mb-1 flex-shrink-0" />
              <span className="text-xs font-medium text-center line-clamp-1">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
