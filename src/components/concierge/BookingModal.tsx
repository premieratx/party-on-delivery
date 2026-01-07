import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock, Users, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';
import { SimpleAddressInput } from '@/components/ui/SimpleAddressInput';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'activity' | 'transport' | 'boat' | 'delivery';
  itemTitle: string;
  itemDetails: {
    description?: string;
    duration?: string;
    price?: number;
    capacity?: string;
    [key: string]: any;
  };
}

export function BookingModal({ isOpen, onClose, itemType, itemTitle, itemDetails }: BookingModalProps) {
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [pickupAddress, setPickupAddress] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  const addToItinerary = useAppStore((state) => state.addToItinerary);
  const { toast } = useToast();

  const needsAddress = itemType === 'transport' || itemType === 'boat';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!date) {
      toast({
        title: "Date required",
        description: "Please select a date for your booking.",
        variant: "destructive"
      });
      return;
    }

    if (!time) {
      toast({
        title: "Time required",
        description: "Please select a time for your booking.",
        variant: "destructive"
      });
      return;
    }

    if (needsAddress && !pickupAddress) {
      toast({
        title: "Address required",
        description: "Please enter a pickup address.",
        variant: "destructive"
      });
      return;
    }

    // Add to itinerary
    const itineraryItem = {
      id: `${itemType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: itemType,
      title: itemTitle,
      date: format(date, 'yyyy-MM-dd'),
      startTime: time,
      imageUrl: itemDetails.imageUrl,
      meta: {
        ...itemDetails,
        numberOfPeople,
        pickupAddress: needsAddress ? pickupAddress : undefined,
        specialRequests: specialRequests || undefined,
        status: 'pending'
      }
    };

    addToItinerary(itineraryItem);

    toast({
      title: "Booking Request Submitted!",
      description: "We will reach out to confirm your booking within 24 hours. Check your itinerary for details.",
      duration: 5000,
    });

    // Reset form and close
    setDate(undefined);
    setTime('');
    setNumberOfPeople('1');
    setPickupAddress('');
    setSpecialRequests('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="max-w-lg bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 border-white/20 text-white max-h-[90vh] overflow-y-auto z-[110]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Book: {itemTitle}
          </DialogTitle>
          <p className="text-white/70 text-sm">
            Fill in the details below to request your booking
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="text-white flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2" />
              Select Date *
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                    !date && "text-white/60"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-white border-white/20 z-50" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label className="text-white flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Select Time *
            </Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              required
            />
          </div>

          {/* Number of People */}
          <div className="space-y-2">
            <Label className="text-white flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Number of People *
            </Label>
            <Input
              type="number"
              min="1"
              max="50"
              value={numberOfPeople}
              onChange={(e) => setNumberOfPeople(e.target.value)}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              required
            />
          </div>

          {/* Pickup Address (for transport/boat) */}
          {needsAddress && (
            <div className="space-y-2">
              <Label className="text-white flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Pickup Address *
              </Label>
              <SimpleAddressInput
                value={pickupAddress}
                onChange={setPickupAddress}
                placeholder="Enter pickup address"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
          )}

          {/* Special Requests */}
          <div className="space-y-2">
            <Label className="text-white">
              Special Requests (Optional)
            </Label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Any special requests or notes..."
              className="w-full min-h-[80px] bg-white/10 border border-white/20 rounded-md p-3 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div>

          {/* Price Display */}
          {itemDetails.price && (
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <div className="flex items-center justify-between">
                <span className="text-white/80">Estimated Price</span>
                <span className="text-2xl font-bold text-white">${itemDetails.price}</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1 bg-white/20 text-white hover:bg-white/30"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="flex-1"
            >
              Request Booking
            </Button>
          </div>

          <p className="text-xs text-white/60 text-center">
            * We will reach out to confirm your booking within 24 hours
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
