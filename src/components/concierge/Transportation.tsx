import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users } from 'lucide-react';
import { VehicleDetailModal } from './VehicleDetailModal';

// Import vehicle images
import executiveSedanImg from '@/assets/vehicles/executive-sedan.jpg';
import executiveSuvImg from '@/assets/vehicles/executive-suv.jpg';
import premiumSedanImg from '@/assets/vehicles/premium-sedan.jpg';
import sprinterVanImg from '@/assets/vehicles/sprinter-van.jpg';
import mini23PaxImg from '@/assets/vehicles/23-pax-mini.jpg';
import mini29PaxImg from '@/assets/vehicles/29-pax-mini.jpg';
import executive23PaxImg from '@/assets/vehicles/23-pax-executive.jpg';
import executive29PaxImg from '@/assets/vehicles/29-pax-executive.jpg';
import executive37PaxImg from '@/assets/vehicles/37-pax-executive.jpg';
import coach49PaxImg from '@/assets/vehicles/49-pax-coach.jpg';
import limo8PaxImg from '@/assets/vehicles/8-pax-limo.jpg';
import sprinterLimo12PaxImg from '@/assets/vehicles/12-pax-sprinter-limo.jpg';
import limoBus16PaxImg from '@/assets/vehicles/16-pax-limo-bus.jpg';
import limoCoach32PaxImg from '@/assets/vehicles/32-pax-limo-coach.jpg';
import ada10PaxImg from '@/assets/vehicles/ada-10-pax.jpg';
import ada29PaxImg from '@/assets/vehicles/ada-29-pax.jpg';

interface TransportationProps {
  onBack: () => void;
}

const Transportation: React.FC<TransportationProps> = ({ onBack }) => {
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const vehicles = [
    {
      id: 'executive-sedan',
      name: 'Executive Sedan',
      description: 'Premium sedan service for airport transfers and city rides',
      capacity: '1-3 passengers',
      hourlyRate: 124.74,
      features: ['Professional chauffeur', 'Leather interior', 'WiFi', 'Complimentary water'],
      image: executiveSedanImg
    },
    {
      id: 'executive-suv',
      name: 'Executive SUV',
      description: 'Spacious luxury SUV perfect for groups with luggage',
      capacity: '1-6 passengers',
      hourlyRate: 138.60,
      features: ['Professional chauffeur', 'Premium sound system', 'Extra cargo space', 'Refreshments'],
      image: executiveSuvImg
    },
    {
      id: 'premium-sedan',
      name: 'Premium Sedan',
      description: 'Top-tier luxury sedan experience with Mercedes S-Class service',
      capacity: '1-3 passengers',
      hourlyRate: 165.00,
      features: ['Professional chauffeur', 'Premium leather', 'Advanced climate control', 'Premium amenities'],
      image: premiumSedanImg
    },
    {
      id: 'sprinter-van-14',
      name: '14 Passenger Sprinter Van',
      description: 'Comfortable Mercedes Sprinter for medium groups',
      capacity: '1-14 passengers',
      hourlyRate: 168.96,
      features: ['Professional driver', 'Climate control', 'Comfortable seating', 'Luggage space'],
      image: sprinterVanImg
    },
    {
      id: '23-pax-mini',
      name: '23 Passenger Mini Bus',
      description: 'Efficient group transportation for medium-sized parties',
      capacity: '1-23 passengers',
      hourlyRate: 173.25,
      features: ['Professional driver', 'Air conditioning', 'PA system', 'Storage'],
      image: mini23PaxImg
    },
    {
      id: '29-pax-mini',
      name: '29 Passenger Mini Bus',
      description: 'Spacious mini bus for larger group transportation',
      capacity: '1-29 passengers',
      hourlyRate: 181.91,
      features: ['Professional driver', 'Climate control', 'Audio system', 'Luggage compartment'],
      image: mini29PaxImg
    },
    {
      id: '23-pax-executive',
      name: '23 Passenger Executive Mini Bus',
      description: 'Premium mini bus with executive amenities',
      capacity: '1-23 passengers',
      hourlyRate: 199.24,
      features: ['Professional driver', 'Premium seating', 'Entertainment system', 'WiFi'],
      image: executive23PaxImg
    },
    {
      id: '29-pax-executive',
      name: '29 Passenger Executive Mini Bus',
      description: 'Luxury mini bus with enhanced comfort and features',
      capacity: '1-29 passengers',
      hourlyRate: 207.90,
      features: ['Professional driver', 'Leather seats', 'Premium audio', 'Climate zones'],
      image: executive29PaxImg
    },
    {
      id: '37-pax-executive',
      name: '37 Passenger Executive Mini Bus',
      description: 'Large capacity executive bus for major events',
      capacity: '1-37 passengers',
      hourlyRate: 217.80,
      features: ['Professional driver', 'Executive seating', 'Entertainment', 'Premium amenities'],
      image: executive37PaxImg
    },
    {
      id: '49-pax-coach',
      name: '49 Passenger Motor Coach',
      description: 'Full-size luxury motor coach for large groups',
      capacity: '1-49 passengers',
      hourlyRate: 233.89,
      features: ['Professional driver', 'Reclining seats', 'Restroom', 'Entertainment system'],
      image: coach49PaxImg
    },
    {
      id: '8-pax-limo',
      name: '8 Passenger Limousine',
      description: 'Classic stretch limousine for special occasions',
      capacity: '1-8 passengers',
      hourlyRate: 173.25,
      features: ['Professional chauffeur', 'Bar area', 'Premium sound', 'Mood lighting'],
      image: limo8PaxImg
    },
    {
      id: '12-pax-sprinter-limo',
      name: '12 Passenger Sprinter Limousine',
      description: 'Executive Mercedes Sprinter limo with luxury interior',
      capacity: '1-12 passengers',
      hourlyRate: 233.89,
      features: ['Professional chauffeur', 'Luxury seating', 'Bar service', 'LED lighting'],
      image: sprinterLimo12PaxImg
    },
    {
      id: '16-pax-limo-bus',
      name: '16 Passenger Limo Bus',
      description: 'Party-ready limo bus with entertainment features',
      capacity: '1-16 passengers',
      hourlyRate: 272.25,
      features: ['Professional driver', 'Dance floor', 'Premium sound system', 'Bar'],
      image: limoBus16PaxImg
    },
    {
      id: '32-pax-limo-coach',
      name: '32 Passenger Limo Coach',
      description: 'Ultimate party bus experience for large groups',
      capacity: '1-32 passengers',
      hourlyRate: 389.81,
      features: ['Professional driver', 'Luxury interior', 'Entertainment system', 'Full bar'],
      image: limoCoach32PaxImg
    },
    {
      id: 'ada-10-pax',
      name: 'ADA 10 Passenger (2 Wheelchair)',
      description: 'Accessible transportation with wheelchair lift',
      capacity: '10 passengers + 2 wheelchairs',
      hourlyRate: 190.58,
      features: ['Professional driver', 'Wheelchair lift', 'ADA compliant', 'Secure tie-downs'],
      image: ada10PaxImg
    },
    {
      id: 'ada-29-pax',
      name: 'ADA 29 Passenger (2 Wheelchair)',
      description: 'Large accessible bus for groups with mobility needs',
      capacity: '29 passengers + 2 wheelchairs',
      hourlyRate: 217.80,
      features: ['Professional driver', 'Wheelchair accessible', 'Lift system', 'ADA certified'],
      image: ada29PaxImg
    }
  ];

  const handleViewDetails = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setIsDetailModalOpen(true);
  };

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
              <p className="text-white/90 drop-shadow-lg">Elegant Limousine - Austin's Premier Transportation</p>
            </div>
          </div>
        </motion.div>

        {/* Vehicle Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-xl font-semibold text-white drop-shadow-lg mb-6">Available Vehicles</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {vehicles.map((vehicle, index) => (
              <motion.div
                key={vehicle.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 overflow-hidden">
                  <div className="aspect-video w-full overflow-hidden">
                    <img
                      src={vehicle.image}
                      alt={vehicle.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold text-lg mb-2">{vehicle.name}</h3>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-white/80">
                        <Users className="w-4 h-4 mr-1" />
                        <span className="text-sm">{vehicle.capacity}</span>
                      </div>
                      <span className="text-white font-bold">${vehicle.hourlyRate}/hr</span>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="flex-1 bg-white/10 border-white/30 text-white hover:bg-white/20"
                        onClick={() => handleViewDetails(vehicle)}
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <VehicleDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedVehicle(null);
          }}
          vehicle={selectedVehicle}
        />
      )}
    </div>
  );
};

export default Transportation;
