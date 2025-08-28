import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Clock, CheckCircle } from 'lucide-react';
import { format, addHours, isToday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { DeliveryInfo } from '../DeliveryWidget';
import { getAppTimezone } from '@/utils/timezoneManager';

interface DateTimeStepProps {
  deliveryInfo: DeliveryInfo;
  onDeliveryInfoChange: (info: DeliveryInfo) => void;
  onConfirm: () => void;
  isConfirmed: boolean;
}

const timeSlots = [
  '10:00 AM - 11:00 AM', '10:30 AM - 11:30 AM', '11:00 AM - 12:00 PM',
  '11:30 AM - 12:30 PM', '12:00 PM - 1:00 PM', '12:30 PM - 1:30 PM',
  '1:00 PM - 2:00 PM', '1:30 PM - 2:30 PM', '2:00 PM - 3:00 PM',
  '2:30 PM - 3:30 PM', '3:00 PM - 4:00 PM', '3:30 PM - 4:30 PM',
  '4:00 PM - 5:00 PM', '4:30 PM - 5:30 PM', '5:00 PM - 6:00 PM',
  '5:30 PM - 6:30 PM', '6:00 PM - 7:00 PM', '6:30 PM - 7:30 PM',
  '7:00 PM - 8:00 PM', '7:30 PM - 8:30 PM', '8:00 PM - 9:00 PM',
  '8:30 PM - 9:30 PM'
];

// Use centralized timezone management

export const DateTimeStep: React.FC<DateTimeStepProps> = ({
  deliveryInfo,
  onDeliveryInfoChange,
  onConfirm,
  isConfirmed
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    deliveryInfo.date ? new Date(deliveryInfo.date) : undefined
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDeliveryInfoChange({ ...deliveryInfo, date });
      setIsCalendarOpen(false);
    }
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    onDeliveryInfoChange({ ...deliveryInfo, timeSlot });
  };

  const isDateTimeComplete = selectedDate && deliveryInfo.timeSlot;

  // ALWAYS show editable form - never lock into confirmation view

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Delivery Date & Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Selection */}
        <div>
          <label className="text-sm font-medium mb-2 block">Delivery Date</label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Select delivery date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                  disabled={(date) => {
                    const today = new Date();
                    const cstToday = toZonedTime(today, getAppTimezone());
                    const cutoffTime = addHours(cstToday, 2);
                  
                  if (isToday(date)) {
                    return new Date() > cutoffTime;
                  }
                  return date < today;
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time Selection */}
        {selectedDate && (
          <div>
            <label className="text-sm font-medium mb-2 block">Delivery Time</label>
            <select
              value={deliveryInfo.timeSlot || ''}
              onChange={(e) => handleTimeSlotSelect(e.target.value)}
              className="w-full p-3 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="" disabled>Select delivery time</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
        )}

        {isDateTimeComplete && (
          <Button onClick={onConfirm} className="w-full">
            Confirm Date & Time
          </Button>
        )}
      </CardContent>
    </Card>
  );
};