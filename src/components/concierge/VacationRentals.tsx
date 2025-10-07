import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Eye, Wine } from 'lucide-react';
import { RentalDetailModal } from './RentalDetailModal';
import mansion1 from '@/assets/rentals/mansion-1.jpg';
import mansion2 from '@/assets/rentals/mansion-2.jpg';
import mansion3 from '@/assets/rentals/mansion-3.jpg';
import mansion4 from '@/assets/rentals/mansion-4.jpg';
import mansion5 from '@/assets/rentals/mansion-5.jpg';
import mansion6 from '@/assets/rentals/mansion-6.jpg';
import mansion7 from '@/assets/rentals/mansion-7.jpg';
import mansion8 from '@/assets/rentals/mansion-8.jpg';
import mansion9 from '@/assets/rentals/mansion-9.jpg';
import mansion10 from '@/assets/rentals/mansion-10.jpg';
import mansion11 from '@/assets/rentals/mansion-11.jpg';
import mansion12 from '@/assets/rentals/mansion-12.jpg';

interface VacationRentalsProps {
  onBack: () => void;
}

const VacationRentals: React.FC<VacationRentalsProps> = ({ onBack }) => {
  const [selectedRental, setSelectedRental] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const rentals = [
    {
      id: 'luxury-hilltop-estate',
      name: 'Luxury Hilltop Estate',
      capacity: 20,
      pricePerNight: 1250,
      amenities: ['Pool', 'Pool Table', 'Outdoor Grill', 'Hot Tub'],
      imageUrl: mansion1,
      description: 'Modern architectural masterpiece with infinity pool overlooking Austin hills. Perfect for luxury events and gatherings.',
      bedrooms: 8,
      bathrooms: 10
    },
    {
      id: 'mediterranean-villa',
      name: 'Mediterranean Villa Paradise',
      capacity: 18,
      pricePerNight: 1100,
      amenities: ['Pool', 'Outdoor Grill', 'Fire Pit', 'Tennis Court'],
      imageUrl: mansion2,
      description: 'Stunning Mediterranean-style villa with resort amenities and outdoor entertainment complex.',
      bedrooms: 7,
      bathrooms: 8
    },
    {
      id: 'modern-glass-mansion',
      name: 'Ultra Modern Glass Mansion',
      capacity: 22,
      pricePerNight: 1500,
      amenities: ['Pool', 'Pool Table', 'Stripper Pole', 'Home Theater'],
      imageUrl: mansion3,
      description: 'Contemporary glass mansion with state-of-the-art entertainment areas and breathtaking city views.',
      bedrooms: 9,
      bathrooms: 11
    },
    {
      id: 'texas-estate',
      name: 'Texas Hill Country Estate',
      capacity: 16,
      pricePerNight: 980,
      amenities: ['Pool', 'Outdoor Grill', 'Tiki Bar', 'Game Room'],
      imageUrl: mansion4,
      description: 'Sprawling estate with custom pool complex, waterfall features, and multiple entertainment zones.',
      bedrooms: 6,
      bathrooms: 7
    },
    {
      id: 'tuscan-inspired',
      name: 'Tuscan Inspired Mansion',
      capacity: 15,
      pricePerNight: 850,
      amenities: ['Pool', 'Pool Table', 'Outdoor Grill', 'Wine Cellar'],
      imageUrl: mansion5,
      description: 'Elegant Tuscan-style property with multi-level outdoor living spaces and gourmet kitchen.',
      bedrooms: 6,
      bathrooms: 7
    },
    {
      id: 'ranch-style-luxury',
      name: 'Ranch Style Luxury Manor',
      capacity: 24,
      pricePerNight: 1350,
      amenities: ['Pool', 'Outdoor Grill', 'Fire Pit', 'Stripper Pole'],
      imageUrl: mansion6,
      description: 'Massive ranch estate with swim-up bar, outdoor lounge areas, and panoramic hill country views.',
      bedrooms: 10,
      bathrooms: 12
    },
    {
      id: 'architectural-gem',
      name: 'Architectural Gem',
      capacity: 14,
      pricePerNight: 1200,
      amenities: ['Pool', 'Pool Table', 'Rooftop Deck', 'Smart Home'],
      imageUrl: mansion7,
      description: 'Award-winning modern architecture with infinity pool and floor-to-ceiling glass walls.',
      bedrooms: 5,
      bathrooms: 6
    },
    {
      id: 'villa-retreat',
      name: 'Private Villa Retreat',
      capacity: 12,
      pricePerNight: 780,
      amenities: ['Pool', 'Outdoor Grill', 'Courtyard', 'Pool Table'],
      imageUrl: mansion8,
      description: 'Secluded Tuscan villa with private courtyard pool and professional outdoor kitchen.',
      bedrooms: 5,
      bathrooms: 6
    },
    {
      id: 'resort-mansion',
      name: 'Resort Style Mega Mansion',
      capacity: 30,
      pricePerNight: 2200,
      amenities: ['Pool', 'Swim Up Bar', 'Stripper Pole', 'Outdoor Grill'],
      imageUrl: mansion9,
      description: 'Ultimate party mansion with multiple pools, swim-up bar, cabanas, and resort-level amenities.',
      bedrooms: 12,
      bathrooms: 15
    },
    {
      id: 'lagoon-estate',
      name: 'Lagoon Paradise Estate',
      capacity: 28,
      pricePerNight: 1950,
      amenities: ['Pool', 'Water Slides', 'Outdoor Grill', 'Pool Table'],
      imageUrl: mansion10,
      description: 'Spectacular estate with lagoon-style pool, water slides, grotto, and tiki bar.',
      bedrooms: 11,
      bathrooms: 13
    },
    {
      id: 'contemporary-palace',
      name: 'Contemporary Palace',
      capacity: 18,
      pricePerNight: 1450,
      amenities: ['Pool', 'Pool Table', 'Rooftop Deck', 'Outdoor Grill'],
      imageUrl: mansion11,
      description: 'Modern palace with rooftop entertaining, custom LED pool lighting, and skyline views.',
      bedrooms: 7,
      bathrooms: 9
    },
    {
      id: 'private-resort',
      name: 'Private Resort Compound',
      capacity: 25,
      pricePerNight: 1800,
      amenities: ['Pool', 'Outdoor Theater', 'Stripper Pole', 'Outdoor Grill'],
      imageUrl: mansion12,
      description: 'Mega mansion with private resort amenities including beach-entry pool and outdoor cinema.',
      bedrooms: 10,
      bathrooms: 12
    }
  ];

  const handleViewDetails = (rental: any) => {
    setSelectedRental(rental);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-6 pb-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center mb-8"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-white hover:bg-white/20 mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white drop-shadow-2xl">Luxury Vacation Rentals</h1>
            <p className="text-white/90 drop-shadow-lg">Premier Austin mansions for your perfect getaway</p>
          </div>
        </motion.div>

        {/* Rentals Grid - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rentals.map((rental, index) => (
            <motion.div
              key={rental.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300 h-full">
                <CardHeader className="p-4">
                  {/* Image */}
                  <div className="aspect-[16/9] bg-white/20 rounded-lg mb-4 overflow-hidden">
                    <img 
                      src={rental.imageUrl} 
                      alt={rental.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex flex-col">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2">{rental.name}</h3>
                  
                  {/* Capacity */}
                  <div className="flex items-center text-white/80 mb-3">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm">Sleeps {rental.capacity} guests</span>
                  </div>

                  {/* Amenities */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {rental.amenities.slice(0, 3).map((amenity, idx) => (
                      <span key={idx} className="text-xs bg-white/20 text-white px-2 py-1 rounded">
                        {amenity}
                      </span>
                    ))}
                    <span className="text-xs bg-green-500/80 text-white px-2 py-1 rounded flex items-center">
                      <Wine className="w-3 h-3 mr-1" />
                      Alcohol Delivery
                    </span>
                  </div>
                  
                  {/* Price */}
                  <div className="text-white mb-4">
                    <span className="text-sm text-white/70">From</span>
                    <p className="font-bold text-2xl">${rental.pricePerNight}/night</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-auto">
                    <Button 
                      variant="secondary"
                      className="flex-1 bg-white/20 text-white hover:bg-white/30"
                      onClick={() => handleViewDetails(rental)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Detail Modal */}
      <RentalDetailModal
        rental={selectedRental}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
};

export default VacationRentals;
