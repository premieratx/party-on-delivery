import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ItineraryItem } from '@/store/useAppStore';

interface EditItineraryItemModalProps {
  item: ItineraryItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedItem: ItineraryItem) => void;
  defaultDate?: Date;
}

const timeSlots = [
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM', 
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM'
];

export function EditItineraryItemModal({ item, isOpen, onClose, onSave, defaultDate }: EditItineraryItemModalProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [startTime, setStartTime] = useState('12:00 PM');
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [endTime, setEndTime] = useState('');
  const [hasEndTime, setHasEndTime] = useState(false);
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);

  useEffect(() => {
    if (item) {
      // Parse existing date, or use defaultDate (arrival date) if no date set
      if (item.date) {
        setStartDate(new Date(item.date));
      } else if (defaultDate) {
        setStartDate(defaultDate);
      }
      if (item.startTime) {
        setStartTime(item.startTime);
      }
      if (item.endTime) {
        setEndTime(item.endTime);
        setHasEndTime(true);
      } else {
        setEndTime('');
        setHasEndTime(false);
      }
      // End date defaults to same as start if not specified
      if (item.meta?.endDate) {
        setEndDate(new Date(item.meta.endDate));
      } else if (item.date) {
        setEndDate(new Date(item.date));
      } else if (defaultDate) {
        setEndDate(defaultDate);
      }
    }
  }, [item, defaultDate]);

  const handleSave = () => {
    if (!item || !startDate) return;

    const updatedItem: ItineraryItem = {
      ...item,
      date: format(startDate, 'yyyy-MM-dd'),
      startTime,
      endTime: hasEndTime ? endTime : undefined,
      meta: {
        ...item.meta,
        endDate: hasEndTime && endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      },
    };

    onSave(updatedItem);
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md bg-gradient-to-br from-purple-900/95 via-purple-800/95 to-pink-800/95 backdrop-blur-xl border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">Edit Date & Time</DialogTitle>
        </DialogHeader>

        <div className="space-y-2 mt-2">
          <p className="text-white/80 text-sm">{item.title}</p>
        </div>

        <div className="space-y-6 mt-4">
          {/* Start Date/Time */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-white/90">Start Date & Time</label>
            <div className="flex gap-3">
              <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left bg-white/10 border-white/20 text-white hover:bg-white/20",
                      !startDate && "text-white/50"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM d, yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-purple-900 border-white/20 z-[200]" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(date) => {
                      setStartDate(date);
                      if (!endDate || (date && endDate < date)) {
                        setEndDate(date);
                      }
                      setStartCalendarOpen(false);
                    }}
                    className="pointer-events-auto bg-purple-900 text-white"
                  />
                </PopoverContent>
              </Popover>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                <select
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="h-10 pl-10 pr-4 bg-white/10 border border-white/20 rounded-md text-white appearance-none cursor-pointer"
                >
                  {timeSlots.map((time) => (
                    <option key={time} value={time} className="bg-purple-900 text-white">{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* End Time Toggle */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="hasEndTime"
              checked={hasEndTime}
              onChange={(e) => setHasEndTime(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <label htmlFor="hasEndTime" className="text-sm text-white/90">Add end date/time (optional)</label>
          </div>

          {/* End Date/Time */}
          {hasEndTime && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-white/90">End Date & Time</label>
              <div className="flex gap-3">
                <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start text-left bg-white/10 border-white/20 text-white hover:bg-white/20",
                        !endDate && "text-white/50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "MMM d, yyyy") : "Select date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-purple-900 border-white/20 z-[200]" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => {
                        setEndDate(date);
                        setEndCalendarOpen(false);
                      }}
                      disabled={(date) => startDate ? date < startDate : false}
                      className="pointer-events-auto bg-purple-900 text-white"
                    />
                  </PopoverContent>
                </Popover>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <select
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-10 pl-10 pr-4 bg-white/10 border border-white/20 rounded-md text-white appearance-none cursor-pointer"
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time} className="bg-purple-900 text-white">{time}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!startDate}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold"
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
