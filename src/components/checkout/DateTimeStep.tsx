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

const CST_TIMEZONE = 'America/Chicago';

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

  if (isConfirmed && isDateTimeComplete) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Delivery Date & Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="w-4 h-4" />
              <span>{format(selectedDate!, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>{deliveryInfo.timeSlot}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

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
                  const cstToday = toZonedTime(today, CST_TIMEZONE);
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
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {timeSlots.map((slot) => (
                <Button
                  key={slot}
                  variant={deliveryInfo.timeSlot === slot ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleTimeSlotSelect(slot)}
                  className="text-xs py-2"
                >
                  {slot}
                </Button>
              ))}
            </div>
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