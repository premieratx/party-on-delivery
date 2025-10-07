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
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{vehicle.name}</DialogTitle>
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
              <p className="text-muted-foreground mb-4">{vehicle.description}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">{vehicle.capacity}</span>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Features included:</h3>
                <div className="grid grid-cols-2 gap-2">
                  {vehicle.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing Breakdown */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-lg mb-3">Pricing</h3>
              
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Hourly Rate</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sales Tax (8.25%)</span>
                <span className="font-medium">${salesTax.toFixed(2)}</span>
              </div>

              <div className="border-t pt-3 flex justify-between items-center">
                <span className="font-semibold">Total per Hour</span>
                <span className="font-bold text-lg">${grandTotal.toFixed(2)}</span>
              </div>

              <div className="bg-background rounded p-3 mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Required Deposit (25%)</span>
                  <span className="font-semibold">${deposit.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
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
                size="lg"
                className="flex-1"
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
