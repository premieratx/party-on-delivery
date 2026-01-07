import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface TripDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dates: { arrivalDate: Date; arrivalTime: string; departureDate: Date; departureTime: string }) => void;
  initialDates?: {
    arrivalDate?: Date;
    arrivalTime?: string;
    departureDate?: Date;
    departureTime?: string;
  };
}

const timeSlots = [
  '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
  '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'
];

export function TripDatesModal({ isOpen, onClose, onSave, initialDates }: TripDatesModalProps) {
  const [arrivalDate, setArrivalDate] = useState<Date | undefined>(initialDates?.arrivalDate);
  const [arrivalTime, setArrivalTime] = useState(initialDates?.arrivalTime || '3:00 PM');
  const [departureDate, setDepartureDate] = useState<Date | undefined>(initialDates?.departureDate);
  const [departureTime, setDepartureTime] = useState(initialDates?.departureTime || '11:00 AM');
  const [arrivalCalendarOpen, setArrivalCalendarOpen] = useState(false);
  const [departureCalendarOpen, setDepartureCalendarOpen] = useState(false);

  const handleSave = () => {
    if (arrivalDate && departureDate) {
      onSave({ arrivalDate, arrivalTime, departureDate, departureTime });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-pink-800/95 backdrop-blur-xl border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Set Trip Dates</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Arrival */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white/90">Arrival</label>
            <div className="flex gap-3">
              <Popover open={arrivalCalendarOpen} onOpenChange={setArrivalCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left bg-white/10 border-white/20 text-white hover:bg-white/20",
                      !arrivalDate && "text-white/50"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {arrivalDate ? format(arrivalDate, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-purple-900 border-white/20 z-[200]" align="start">
                  <Calendar
                    mode="single"
                    selected={arrivalDate}
                    onSelect={(date) => {
                      setArrivalDate(date);
                      setArrivalCalendarOpen(false);
                    }}
                    disabled={(date) => date < new Date()}
                    className="pointer-events-auto bg-purple-900 text-white"
                  />
                </PopoverContent>
              </Popover>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <select
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                  className="h-10 pl-10 pr-4 bg-white/10 border border-white/20 rounded-md text-white appearance-none cursor-pointer"
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time} className="bg-purple-900 text-white">{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Departure */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white/90">Departure</label>
            <div className="flex gap-3">
              <Popover open={departureCalendarOpen} onOpenChange={setDepartureCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left bg-white/10 border-white/20 text-white hover:bg-white/20",
                      !departureDate && "text-white/50"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {departureDate ? format(departureDate, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-purple-900 border-white/20 z-[200]" align="start">
                  <Calendar
                    mode="single"
                    selected={departureDate}
                    onSelect={(date) => {
                      setDepartureDate(date);
                      setDepartureCalendarOpen(false);
                    }}
                    disabled={(date) => date < (arrivalDate || new Date())}
                    className="pointer-events-auto bg-purple-900 text-white"
                  />
                </PopoverContent>
              </Popover>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <select
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="h-10 pl-10 pr-4 bg-white/10 border border-white/20 rounded-md text-white appearance-none cursor-pointer"
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time} className="bg-purple-900 text-white">{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!arrivalDate || !departureDate}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
          >
            Save Dates
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
