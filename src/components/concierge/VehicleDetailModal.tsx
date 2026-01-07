import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, X } from 'lucide-react';
import { BookingModal } from './BookingModal';
import { AddToItineraryButton } from './AddToItineraryButton';

interface VehicleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: {
    id: string;
    name: string;
    description: string;
    capacity: string;
    hourlyRate: number;
    features: string[];
    image: string;
  };
}

export const VehicleDetailModal: React.FC<VehicleDetailModalProps> = ({
  isOpen,
  onClose,
  vehicle,
}) => {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const subtotal = vehicle.hourlyRate;
  const salesTax = subtotal * 0.0825;
  const grandTotal = subtotal + salesTax;
  const deposit = grandTotal * 0.25;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) onClose();
      }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 border-white/20 text-white z-[100]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-white">{vehicle.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Vehicle Image */}
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={vehicle.image}
                alt={vehicle.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Vehicle Details */}
            <div>
              <p className="text-white/80 mb-4">{vehicle.description}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-white/70" />
                <span className="font-medium text-white">{vehicle.capacity}</span>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-white">Features included:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-green-400">✓</span>
                      <span className="text-sm text-white/80">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg mb-3 text-white">Pricing</h3>
              
              <div className="flex justify-between items-center">
                <span className="text-white/70">Hourly Rate</span>
                <span className="font-medium text-white">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-white/70">Sales Tax (8.25%)</span>
                <span className="font-medium text-white">${salesTax.toFixed(2)}</span>
              </div>

              <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                <span className="font-semibold text-white">Total per Hour</span>
                <span className="font-bold text-lg text-white">${grandTotal.toFixed(2)}</span>
              </div>

              <div className="bg-white/10 rounded p-3 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-white/70">Required Deposit (25%)</span>
                  <span className="font-semibold text-white">${deposit.toFixed(2)}</span>
                </div>
                <p className="text-xs text-white/70">
                  Remaining balance due 30 days before the event
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                className="flex-1" 
                size="lg"
                onClick={() => setIsBookingModalOpen(true)}
              >
                Book Now
              </Button>
              <AddToItineraryButton
                item={{
                  type: 'transport',
                  title: vehicle.name,
                  date: new Date().toISOString().split('T')[0],
                  imageUrl: vehicle.image,
                  meta: {
                    description: vehicle.description,
                    capacity: vehicle.capacity,
                    hourlyRate: vehicle.hourlyRate,
                    features: vehicle.features
                  }
                }}
                variant="secondary"
                size="lg"
                className="flex-1 bg-white/15 text-white hover:bg-white/25"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        itemType="transport"
        itemTitle={vehicle.name}
        itemDetails={{
          description: vehicle.description,
          capacity: vehicle.capacity,
          price: vehicle.hourlyRate,
          features: vehicle.features
        }}
      />
    </>
  );
};
