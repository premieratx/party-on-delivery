import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, ChevronLeft, ChevronRight } from 'lucide-react';
import meseeks1 from '@/assets/boats/meseeks-1.jpg';
import meseeks2 from '@/assets/boats/meseeks-2.jpg';
import meseeks3 from '@/assets/boats/meseeks-3.jpg';
import irony1 from '@/assets/boats/irony-1.jpg';
import irony2 from '@/assets/boats/irony-2.jpg';
import cleverGirl1 from '@/assets/boats/clever-girl-1.jpg';
import cleverGirl2 from '@/assets/boats/clever-girl-2.jpg';
import cleverGirl3 from '@/assets/boats/clever-girl-3.jpg';
import cleverGirl4 from '@/assets/boats/clever-girl-4.jpg';
import cleverGirl5 from '@/assets/boats/clever-girl-5.jpg';
import dayTripper1 from '@/assets/boats/day-tripper-1.jpg';
import dayTripper2 from '@/assets/boats/day-tripper-2.jpg';
import dayTripper3 from '@/assets/boats/day-tripper-3.jpg';
import dayTripper4 from '@/assets/boats/day-tripper-4.jpg';
import dayTripper5 from '@/assets/boats/day-tripper-5.jpg';

interface Boat {
  name: string;
  capacity: string;
  images: string[];
  description: string;
}

const boats: Boat[] = [
  {
    name: "Meeseeks / The Irony",
    capacity: "25-30 max",
    images: [meseeks1, meseeks2, meseeks3, irony1, irony2],
    description: "Perfect for medium-sized groups looking for an unforgettable Lake Travis experience. These boats feature covered seating, sound systems, and comfortable amenities for your party."
  },
  {
    name: "Day Tripper",
    capacity: "15-25 Guests",
    images: [dayTripper1, dayTripper2, dayTripper3, dayTripper4, dayTripper5],
    description: "Ideal for smaller groups seeking a premium Lake Travis experience. Features comfortable seating, excellent sound system, and all the amenities needed for an amazing day on the water."
  },
  {
    name: "Clever Girl",
    capacity: "31-75 Guests",
    images: [cleverGirl1, cleverGirl2, cleverGirl3, cleverGirl4, cleverGirl5],
    description: "Our flagship party boat featuring the iconic Texas flag deck, 14 disco balls, and massive space for epic celebrations. Perfect for large groups, corporate events, and unforgettable bachelor/bachelorette parties."
  }
];

interface BoatGalleryModalProps {
  boat: Boat | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BoatGalleryModal({ boat, isOpen, onClose }: BoatGalleryModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!boat) return null;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % boat.images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + boat.images.length) % boat.images.length);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-4xl bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-pink-800/95 backdrop-blur-xl border-white/20 text-white max-h-[90vh] overflow-y-auto p-4 md:p-6">
        <div className="space-y-4 md:space-y-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl md:text-2xl font-bold text-white flex items-center justify-between">
              <span>{boat.name}</span>
              <div className="flex items-center gap-2 text-base md:text-lg bg-white/10 px-3 py-1 rounded-full">
                <Users className="w-4 h-4 md:w-5 md:h-5" />
                <span>{boat.capacity}</span>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 md:space-y-6">
            {/* Image Gallery with Navigation */}
            <div className="relative">
              <div className="relative aspect-video bg-white/10 rounded-lg overflow-hidden">
                <img 
                  src={boat.images[currentImageIndex]} 
                  alt={`${boat.name} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain md:object-cover"
                />
                
                {/* Navigation Arrows */}
                {boat.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                    >
                      <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
                    >
                      <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                <div className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {boat.images.length}
                </div>
              </div>

              {/* Thumbnail Navigation */}
              <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                {boat.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === index 
                        ? 'border-white shadow-lg scale-105' 
                        : 'border-white/30 hover:border-white/60 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/5 rounded-lg p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-2">About This Boat</h3>
              <p className="text-sm md:text-base text-white/80 leading-relaxed">
                {boat.description}
              </p>
            </div>

            {/* Features */}
            <div className="bg-white/5 rounded-lg p-4 md:p-6">
              <h3 className="text-base md:text-lg font-semibold mb-3">Features & Amenities</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <span className="text-green-400">✓</span>
                  <span>Covered Seating Areas</span>
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <span className="text-green-400">✓</span>
                  <span>Premium Sound System</span>
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <span className="text-green-400">✓</span>
                  <span>Disco Lighting</span>
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <span className="text-green-400">✓</span>
                  <span>Licensed Captain Included</span>
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <span className="text-green-400">✓</span>
                  <span>Coolers & Ice Provided</span>
                </div>
                <div className="flex items-center gap-2 text-sm md:text-base">
                  <span className="text-green-400">✓</span>
                  <span>Swimming Platform</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <Button
              variant="default"
              size="lg"
              className="w-full text-sm md:text-base py-4 md:py-6 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
              onClick={() => {
                // Scroll to top of booking iframe
                window.scrollTo({ top: 0, behavior: 'smooth' });
                onClose();
              }}
            >
              Book This Boat Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export boats data for use in parent component
export { boats };
