import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, CheckCircle, Edit2 } from 'lucide-react';
import { format, addHours, isToday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { DeliveryInfo } from '../DeliveryWidget';
import { getAppTimezone } from '@/utils/timezoneManager';

interface ImprovedDateTimeStepProps {
  deliveryInfo: DeliveryInfo;
  onDeliveryInfoChange: (info: DeliveryInfo) => void;
  onConfirm: () => void;
  onEdit?: () => void;
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
const DELIVERY_INFO_KEY = 'saved-delivery-datetime';

export const ImprovedDateTimeStep: React.FC<ImprovedDateTimeStepProps> = ({
  deliveryInfo,
  onDeliveryInfoChange,
  onConfirm,
  onEdit,
  isConfirmed
}) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    deliveryInfo.date ? new Date(deliveryInfo.date) : undefined
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Load saved delivery info on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DELIVERY_INFO_KEY);
      if (saved && !deliveryInfo.date && !deliveryInfo.timeSlot) {
        const parsedData = JSON.parse(saved);
        if (parsedData.date && parsedData.timeSlot) {
          const savedDate = new Date(parsedData.date);
          setSelectedDate(savedDate);
          onDeliveryInfoChange({
            ...deliveryInfo,
            date: savedDate,
            timeSlot: parsedData.timeSlot
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load saved delivery info:', error);
    }
  }, []);

  // Save delivery info whenever it changes
  useEffect(() => {
    if (selectedDate && deliveryInfo.timeSlot) {
      try {
        localStorage.setItem(DELIVERY_INFO_KEY, JSON.stringify({
          date: selectedDate.toISOString(),
          timeSlot: deliveryInfo.timeSlot
        }));
      } catch (error) {
        console.warn('Failed to save delivery info:', error);
      }
    }
  }, [selectedDate, deliveryInfo.timeSlot]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const updatedInfo = { ...deliveryInfo, date };
      onDeliveryInfoChange(updatedInfo);
      setIsCalendarOpen(false);
      
      // Auto-save to localStorage immediately
      try {
        localStorage.setItem('partyondelivery_delivery_info', JSON.stringify({
          ...updatedInfo,
          date: date.toISOString()
        }));
      } catch (error) {
        console.warn('Failed to auto-save delivery date:', error);
      }
    }
  };

  const handleTimeSlotSelect = (timeSlot: string) => {
    const updatedInfo = { ...deliveryInfo, timeSlot };
    onDeliveryInfoChange(updatedInfo);
    
    // Auto-save to localStorage immediately
    try {
      localStorage.setItem('partyondelivery_delivery_info', JSON.stringify({
        ...updatedInfo,
        date: updatedInfo.date ? updatedInfo.date.toISOString() : null
      }));
    } catch (error) {
      console.warn('Failed to auto-save delivery time:', error);
    }
  };

  const isDateTimeComplete = selectedDate && deliveryInfo.timeSlot;

  // Confirmed (collapsed) view
  if (isConfirmed && isDateTimeComplete) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">
                  {selectedDate ? format(selectedDate, 'EEE, MMM d, yyyy') : ''} at {deliveryInfo.timeSlot}
                </p>
                <p className="text-xs text-muted-foreground">Delivery date & time confirmed</p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEdit}
              className="flex items-center gap-2"
            >
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full edit view

  return (
    <Card>
      <CardHeader className="pb-3 px-3 pt-3 sm:px-6 sm:pt-6">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          Select Delivery Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 p-3 sm:p-6">
        {/* Responsive Grid for Date and Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          
          {/* Date Selection - Constrained Width */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-foreground">Delivery Date</label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 sm:h-11 text-xs sm:text-sm",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="truncate">
                    {selectedDate ? format(selectedDate, 'EEE, MMM d, yyyy') : 'Select delivery date'}
                  </span>
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
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Selection - Constrained Width */}
          <div className="space-y-2">
            <label className="text-xs sm:text-sm font-medium text-foreground">Delivery Time</label>
            <Select
              value={deliveryInfo.timeSlot || ''}
              onValueChange={handleTimeSlotSelect}
              disabled={!selectedDate}
            >
              <SelectTrigger className="w-full h-9 sm:h-11 text-xs sm:text-sm">
                <SelectValue placeholder="Select delivery time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot} className="text-xs sm:text-sm">
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Confirmation Button */}
        {isDateTimeComplete && (
          <div className="pt-2">
            <Button 
              onClick={onConfirm} 
              className="w-full h-9 sm:h-11 font-semibold text-xs sm:text-sm"
              size="lg"
            >
              Confirm Date & Time
            </Button>
          </div>
        )}

        {/* Helpful Text */}
        <div className="text-xs text-muted-foreground bg-muted/30 p-2 sm:p-3 rounded-lg">
          <p>• Same-day delivery available until 2 hours before cutoff</p>
          <p>• Your delivery preferences will be saved for future orders</p>
        </div>
      </CardContent>
    </Card>
  );
};