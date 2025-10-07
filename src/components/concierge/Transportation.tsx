import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Car, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BookingModal } from './BookingModal';

interface TransportationProps {
  onBack: () => void;
}

const Transportation: React.FC<TransportationProps> = ({ onBack }) => {
  const [selectedService, setSelectedService] = useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const transportServices = [
    {
      id: 'luxury-sedan',
      name: 'Luxury Sedan',
      description: 'Premium sedan for airport transfers and city rides',
      capacity: '1-3 passengers',
      price: '$85/hour',
      features: ['Professional driver', 'Leather seats', 'WiFi', 'Water bottles'],
      rating: 4.9,
      availability: 'Available now'
    },
    {
      id: 'suv',
      name: 'Luxury SUV',
      description: 'Spacious SUV perfect for groups and luggage',
      capacity: '1-6 passengers',
      price: '$125/hour',
      features: ['Professional driver', 'Extra space', 'Premium sound', 'Refreshments'],
      rating: 4.8,
      availability: 'Available in 15 min'
    },
    {
      id: 'party-bus',
      name: 'Party Bus',
      description: 'Ultimate group transportation with entertainment',
      capacity: '8-20 passengers',
      price: '$200/hour',
      features: ['Professional driver', 'Sound system', 'LED lights', 'Mini bar'],
      rating: 4.7,
      availability: 'Book in advance'
    },
    {
      id: 'helicopter',
      name: 'Helicopter Tours',
      description: 'See Austin from above with scenic helicopter rides',
      capacity: '1-4 passengers',
      price: '$450/hour',
      features: ['Licensed pilot', 'Scenic routes', 'Photo opportunities', 'Luxury experience'],
      rating: 5.0,
      availability: 'Weather dependent'
    }
  ];

  const quickBookOptions = [
    { id: 'airport', title: 'Airport Transfer', description: 'To/from Austin-Bergstrom', price: '$65' },
    { id: 'downtown', title: 'Downtown Austin', description: '2-hour city tour', price: '$180' },
    { id: 'lake', title: 'Lake Austin', description: 'Scenic lake district ride', price: '$95' },
    { id: 'hill-country', title: 'Hill Country', description: 'Half-day wine tour', price: '$350' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="text-white hover:bg-white/20 mr-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-2xl">Transportation</h1>
              <p className="text-white/90 drop-shadow-lg">Luxury transportation services in Austin</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Book Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <h2 className="text-xl font-semibold text-white drop-shadow-lg mb-4">Quick Book</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickBookOptions.map((option) => (
              <Card key={option.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer">
                <CardContent className="p-4 text-center">
                  <h3 className="text-white font-semibold mb-1">{option.title}</h3>
                  <p className="text-white/70 text-sm mb-2">{option.description}</p>
                  <Badge variant="secondary" className="text-sm bg-white/20 text-white">{option.price}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Transportation Services */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl font-semibold text-white drop-shadow-lg mb-6">Available Vehicles</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {transportServices.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 + 0.3 }}
              >
                <Card className={`bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 cursor-pointer ${
                  selectedService === service.id ? 'border-white/40 bg-white/20' : ''
                }`}>
                  <CardHeader className="p-4">
                    <div className="aspect-[3/2] bg-white/20 rounded-lg mb-3 flex items-center justify-center">
                      <Car className="w-12 h-12 text-white/60" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs bg-white/20 text-white">
                        {service.availability}
                      </Badge>
                      <div className="flex items-center text-yellow-400">
                        <span className="text-sm font-semibold">★ {service.rating}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <h3 className="text-white font-semibold text-lg mb-2">{service.name}</h3>
                    <p className="text-white/70 text-sm mb-3">{service.description}</p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center text-white/80">
                        <Users className="w-4 h-4 mr-1" />
                        <span className="text-sm">{service.capacity}</span>
                      </div>
                      <span className="text-white font-bold">{service.price}</span>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-white/80 text-sm font-semibold mb-2">Features included:</h4>
                      <div className="grid grid-cols-2 gap-1">
                        {service.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center text-white/70 text-xs">
                            <span className="w-1 h-1 bg-white/50 rounded-full mr-2"></span>
                            {feature}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="default"
                        className="flex-1"
                        onClick={() => {
                          setSelectedService(service);
                          setIsBookingModalOpen(true);
                        }}
                      >
                        Book Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

      {/* Booking Modal */}
      {selectedService && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedService(null);
          }}
          itemType="transport"
          itemTitle={selectedService.name}
          itemDetails={{
            description: selectedService.description,
            capacity: selectedService.capacity,
            price: parseInt(selectedService.price.replace('$', '').split('/')[0]),
            features: selectedService.features
          }}
        />
      )}
      </div>
    </div>
  );
};

export default Transportation;
