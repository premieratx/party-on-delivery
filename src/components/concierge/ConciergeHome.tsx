import { motion } from 'framer-motion';
import { Calendar, ShoppingCart, Car, Ship, MapPin, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';

const services = [
  {
    icon: Calendar,
    title: 'View Itinerary',
    description: 'See your planned activities and reservations',
    href: '/itinerary',
    color: 'bg-blue-500'
  },
  {
    icon: ShoppingCart,
    title: 'Order Alcohol Delivery',
    description: 'Premium spirits delivered to your location',
    href: '/app/delivery',
    color: 'bg-purple-500'
  },
  {
    icon: Car,
    title: 'Arrange Transportation',
    description: 'Luxury vehicles for group transportation',
    href: '/transport',
    color: 'bg-green-500'
  },
  {
    icon: Ship,
    title: 'Reserve a Boat Rental',
    description: 'Austin lake adventures await',
    href: '/boats',
    color: 'bg-blue-600'
  },
  {
    icon: MapPin,
    title: 'Find Something Fun to Do',
    description: 'Discover Austin\'s best activities',
    href: '/explore',
    color: 'bg-orange-500'
  },
  {
    icon: Settings,
    title: 'Admin Dashboard',
    description: 'Manage apps, covers, and track performance',
    href: '/admin',
    color: 'bg-gray-600'
  }
];

export function ConciergeHome() {
  return (
    <div className="min-h-screen pb-20 pt-16">
      {/* Header */}
      <div className="bg-card/20 backdrop-blur-md border-b border-border p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-foreground">Premier Concierge</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Everything you need for an awesome weekend in Austin.</p>
        </motion.div>
      </div>

      {/* Services Grid */}
      <div className="p-4 sm:p-6 space-y-4">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg sm:text-xl font-semibold text-foreground mb-4"
        >
          Our Services
        </motion.h2>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {services.map((service, index) => (
            <motion.div
              key={service.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="aspect-square"
            >
              <Link to={service.href} className="block h-full">
                <Card className="bg-card/50 backdrop-blur-md border-border hover:bg-card/60 hover:shadow-md transition-all duration-300 h-full">
                  <CardContent className="p-3 sm:p-4 flex flex-col justify-center items-center text-center h-full">
                    <div className={`${service.color} p-3 sm:p-4 rounded-xl text-white mb-3`}>
                      <service.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-card-foreground text-sm sm:text-base leading-tight">{service.title}</h3>
                      <p className="text-muted-foreground text-xs leading-tight line-clamp-2">{service.description}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
