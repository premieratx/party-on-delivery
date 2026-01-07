import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Ship } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';

interface BoatSaveTheDateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const timeSlots = [
  { label: 'Morning Cruise (11 AM - 3 PM)', value: '11:00 AM', endTime: '3:00 PM' },
  { label: 'Afternoon Cruise (12 PM - 4 PM)', value: '12:00 PM', endTime: '4:00 PM' },
  { label: 'Sunset Cruise (3:30 PM - 7:30 PM)', value: '3:30 PM', endTime: '7:30 PM' },
  { label: 'Evening Cruise (4:30 PM - 8:30 PM)', value: '4:30 PM', endTime: '8:30 PM' },
];

export function BoatSaveTheDateModal({ isOpen, onClose }: BoatSaveTheDateModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedSlot, setSelectedSlot] = useState<typeof timeSlots[0] | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const addToItinerary = useAppStore((state) => state.addToItinerary);
  const { toast } = useToast();

  const handleSave = () => {
    if (selectedDate && selectedSlot) {
      addToItinerary({
        id: `boat-${Date.now()}`,
        type: 'boat',
        title: '4-Hour Party Cruise',
        date: format(selectedDate, 'yyyy-MM-dd'),
        startTime: selectedSlot.value,
        endTime: selectedSlot.endTime,
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
        meta: {
          status: 'saved',
          description: `Party cruise on Lake Travis - ${selectedSlot.label}`,
          duration: '4 hours',
        },
      });
      toast({
        title: "Saved to Itinerary!",
        description: `Party cruise on ${format(selectedDate, 'MMM d, yyyy')} at ${selectedSlot.value} has been added.`,
      });
      onClose();
      setSelectedDate(undefined);
      setSelectedSlot(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-pink-800/95 backdrop-blur-xl border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Ship className="w-6 h-6" />
            Save the Date - Party Cruise
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <p className="text-white/80">
            Reserve a 4-hour time slot for your party cruise. This will save the date to your itinerary while you finalize booking details.
          </p>

          {/* Date Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white/90">Select Date</label>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left bg-white/10 border-white/20 text-white hover:bg-white/20",
                    !selectedDate && "text-white/50"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select cruise date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-purple-900 border-white/20" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setCalendarOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  className="pointer-events-auto bg-purple-900 text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white/90">Select Time Slot</label>
            <div className="grid gap-2">
              {timeSlots.map((slot) => (
                <Button
                  key={slot.value}
                  variant="outline"
                  onClick={() => setSelectedSlot(slot)}
                  className={cn(
                    "w-full justify-start text-left h-auto py-3 px-4",
                    selectedSlot?.value === slot.value
                      ? "bg-yellow-500 border-yellow-500 text-black hover:bg-yellow-600"
                      : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                  )}
                >
                  {slot.label}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!selectedDate || !selectedSlot}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
          >
            Save to Itinerary
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
