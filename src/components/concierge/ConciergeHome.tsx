import { motion } from 'framer-motion';
import { Calendar, ShoppingCart, Car, Ship, MapPin, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import heroImage from '@/assets/hero/party-hero.jpg';

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
    icon: Home,
    title: 'Vacation Rentals',
    description: 'Book luxury mansions for your stay',
    href: '/rentals',
    color: 'bg-pink-500'
  }
];

export function ConciergeHome() {
  return (
    <div className="min-h-screen pb-20 pt-0 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600">
      {/* Hero Section */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img 
          src={heroImage} 
          alt="Party celebration" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/60 via-purple-800/70 to-purple-600" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 flex flex-col justify-center items-center text-center px-4"
        >
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black mb-3 text-white drop-shadow-2xl uppercase tracking-tight">
            Austin's Premier Party Experience
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-white/95 drop-shadow-xl font-semibold max-w-3xl">
            Everything you need for an unforgettable weekend in Austin
          </p>
        </motion.div>
      </div>

      {/* Services Grid */}
      <div className="p-4 sm:p-6 space-y-4">
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg sm:text-xl font-semibold text-white mb-4 drop-shadow-lg"
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
                <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 hover:shadow-2xl hover:shadow-pink-500/30 transition-all duration-300 h-full">
                  <CardContent className="p-3 sm:p-4 flex flex-col justify-center items-center text-center h-full">
                    <div className="bg-white/20 backdrop-blur-sm p-3 sm:p-4 rounded-xl text-white mb-3 shadow-lg">
                      <service.icon className="h-6 w-6 sm:h-8 sm:w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-white text-sm sm:text-base leading-tight drop-shadow-lg">{service.title}</h3>
                      <p className="text-white/80 text-xs leading-tight line-clamp-2 drop-shadow-sm">{service.description}</p>
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
