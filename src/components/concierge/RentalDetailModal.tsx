import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Users, Bed, Bath, Wine, Calendar as CalendarIcon } from 'lucide-react';
import { AddToItineraryButton } from './AddToItineraryButton';

interface Rental {
  id: string;
  name: string;
  capacity: number;
  pricePerNight: number;
  amenities: string[];
  imageUrl: string;
  description: string;
  bedrooms: number;
  bathrooms: number;
}

interface RentalDetailModalProps {
  rental: Rental | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RentalDetailModal({ rental, isOpen, onClose }: RentalDetailModalProps) {
  if (!rental) return null;

  const subtotal = rental.pricePerNight;
  const salesTax = subtotal * 0.0825;
  const grandTotal = subtotal + salesTax;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-pink-800/95 backdrop-blur-xl border-white/20 text-white max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            {rental.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Main Image */}
          <div className="aspect-video bg-white/10 rounded-lg overflow-hidden">
            <img 
              src={rental.imageUrl} 
              alt={rental.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-semibold mb-2">About This Property</h3>
            <p className="text-white/80 leading-relaxed">{rental.description}</p>
          </div>

          {/* Property Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/5 rounded-lg p-4">
            <div className="flex flex-col items-center text-center">
              <Users className="w-6 h-6 mb-2 text-white/70" />
              <p className="text-xs text-white/60">Sleeps</p>
              <p className="font-semibold">{rental.capacity} guests</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Bed className="w-6 h-6 mb-2 text-white/70" />
              <p className="text-xs text-white/60">Bedrooms</p>
              <p className="font-semibold">{rental.bedrooms}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Bath className="w-6 h-6 mb-2 text-white/70" />
              <p className="text-xs text-white/60">Bathrooms</p>
              <p className="font-semibold">{rental.bathrooms}</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <Wine className="w-6 h-6 mb-2 text-green-400" />
              <p className="text-xs text-white/60">Delivery</p>
              <p className="font-semibold text-sm">Available</p>
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Amenities</h3>
            <div className="grid grid-cols-2 gap-3">
              {rental.amenities.map((amenity, idx) => (
                <div key={idx} className="flex items-center bg-white/5 rounded-lg p-3">
                  <span className="text-green-400 mr-3">✓</span>
                  <span className="text-white/80">{amenity}</span>
                </div>
              ))}
              <div className="flex items-center bg-green-500/20 rounded-lg p-3">
                <Wine className="w-5 h-5 mr-3 text-green-400" />
                <span className="text-white/80">Alcohol Delivery Available</span>
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="bg-white/5 rounded-lg p-6 space-y-3">
            <h3 className="text-lg font-semibold mb-4">Pricing</h3>
            
            <div className="flex justify-between text-white/80">
              <span>Nightly Rate</span>
              <span className="font-semibold">${subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between text-white/80">
              <span>Sales Tax (8.25%)</span>
              <span className="font-semibold">${salesTax.toFixed(2)}</span>
            </div>
            
            <div className="h-px bg-white/10 my-3"></div>
            
            <div className="flex justify-between text-lg font-bold">
              <span>Total per Night</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 text-sm text-white/70 space-y-1">
              <p>• 25% deposit required to book</p>
              <p>• Remaining balance due 30 days before check-in</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="default"
              size="lg"
              className="flex-1 text-base py-6"
            >
              <CalendarIcon className="w-5 h-5 mr-2" />
              Book Now
            </Button>
            <AddToItineraryButton
              item={{
                type: 'rental',
                title: rental.name,
                date: new Date().toISOString().split('T')[0],
                imageUrl: rental.imageUrl,
                meta: {
                  description: rental.description,
                  capacity: rental.capacity,
                  pricePerNight: rental.pricePerNight
                }
              }}
              size="lg"
              className="flex-1 text-base py-6"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
