import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import { format, addHours, isToday } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { DeliveryInfo } from '../DeliveryWidget';

interface DeliverySchedulerProps {
  onComplete: (info: DeliveryInfo) => void;
  deliveryInfo: DeliveryInfo;
}

const timeSlots = [
  '10:00 AM - 11:00 AM',
  '10:30 AM - 11:30 AM',
  '11:00 AM - 12:00 PM',
  '11:30 AM - 12:30 PM',
  '12:00 PM - 1:00 PM',
  '12:30 PM - 1:30 PM',
  '1:00 PM - 2:00 PM',
  '1:30 PM - 2:30 PM',
  '2:00 PM - 3:00 PM',
  '2:30 PM - 3:30 PM',
  '3:00 PM - 4:00 PM',
  '3:30 PM - 4:30 PM',
  '4:00 PM - 5:00 PM',
  '4:30 PM - 5:30 PM',
  '5:00 PM - 6:00 PM',
  '5:30 PM - 6:30 PM',
  '6:00 PM - 7:00 PM',
  '6:30 PM - 7:30 PM',
  '7:00 PM - 8:00 PM',
  '7:30 PM - 8:30 PM',
  '8:00 PM - 9:00 PM',
  '8:30 PM - 9:30 PM'
];

const CST_TIMEZONE = 'America/Chicago';

export const DeliveryScheduler: React.FC<DeliverySchedulerProps> = ({ onComplete, deliveryInfo }) => {
  // Pre-select date, ensuring it's not in the past
  const [date, setDate] = useState<Date | undefined>(() => {
    if (deliveryInfo.date) {
      const savedDate = new Date(deliveryInfo.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
      
      // If saved date is in the past, use today instead
      if (savedDate < today) {
        console.log('Saved date is in the past, using today instead');
        return new Date();
      }
      return savedDate;
    }
    // Pre-select today if no date saved
    return new Date();
  });
  const [timeSlot, setTimeSlot] = useState(deliveryInfo.timeSlot);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get current time in CST
  const nowCST = toZonedTime(new Date(), CST_TIMEZONE);
  const minDeliveryDateCST = addHours(nowCST, 1);

  // Get available time slots based on selected date
  const getAvailableTimeSlots = () => {
    if (!date) return timeSlots;
    
    // Convert selected date to CST for comparison
    const selectedDateCST = toZonedTime(date, CST_TIMEZONE);
    
    // If today is selected, filter out time slots that are within 1 hour from current CST time
    if (isToday(selectedDateCST)) {
      return timeSlots.filter(slot => {
        const [timeRange] = slot.split(' - ');
        const [time, period] = timeRange.split(' ');
        const [hours, minutes] = time.split(':').map(Number);
        
        // Convert to 24-hour format
        let slotHours = hours;
        if (period === 'PM' && hours !== 12) slotHours += 12;
        if (period === 'AM' && hours === 12) slotHours = 0;
        
        // Create a date object for the slot time in CST
        const slotDateTime = new Date(selectedDateCST);
        slotDateTime.setHours(slotHours, minutes, 0, 0);
        const slotDateTimeCST = toZonedTime(slotDateTime, CST_TIMEZONE);
        
        // Check if slot is at least 1 hour from current CST time
        return slotDateTimeCST >= minDeliveryDateCST;
      });
    }
    
    return timeSlots;
  };

  const handleContinue = () => {
    if (date && timeSlot) {
      onComplete({
        date,
        timeSlot,
        address: '', // Address will be filled during checkout
        instructions: ''
      });
    }
  };

  const isFormValid = date && timeSlot;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card className="shadow-floating animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
              When would you like delivery?
            </CardTitle>
            <p className="text-muted-foreground">
              Choose your preferred delivery date and time
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Same-day delivery available with 1-hour advance notice. We're closed Sundays.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Delivery Date
              </Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a delivery date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      setDate(selectedDate);
                      setTimeSlot(''); // Clear time slot when date changes
                      setIsCalendarOpen(false);
                    }}
                    disabled={(checkDate) => {
                      // Simple and robust date validation
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Reset time to start of day
                      
                      const checkDay = new Date(checkDate);
                      checkDay.setHours(0, 0, 0, 0); // Reset time to start of day
                      
                      // Check if it's Sunday (0 = Sunday)
                      const isSunday = checkDate.getDay() === 0;
                      
                      // Check if the date is before today (not including today)
                      const isBeforeToday = checkDay.getTime() < today.getTime();
                      
                      console.log('📅 Calendar validation:', {
                        date: checkDate.toDateString(),
                        today: today.toDateString(),
                        isSunday,
                        isBeforeToday,
                        disabled: isBeforeToday || isSunday
                      });
                      
                      return isBeforeToday || isSunday;
                    }}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Delivery Time
              </Label>
               <Select value={timeSlot} onValueChange={setTimeSlot}>
                 <SelectTrigger className="w-full">
                   <SelectValue placeholder="Select a time slot" />
                 </SelectTrigger>
                 <SelectContent className="max-h-[300px] bg-popover border shadow-lg">
                   {getAvailableTimeSlots().map((slot) => (
                     <SelectItem 
                       key={slot} 
                       value={slot}
                       className="cursor-pointer focus:bg-accent focus:text-accent-foreground"
                     >
                       <div className="flex items-center gap-2">
                         <Clock className="w-4 h-4" />
                         {slot}
                       </div>
                     </SelectItem>
                   ))}
                   {getAvailableTimeSlots().length === 0 && (
                     <div className="p-2 text-sm text-muted-foreground text-center">
                       No time slots available today. Please select a future date.
                     </div>
                   )}
                 </SelectContent>
               </Select>
            </div>

            {/* Continue Button */}
            <Button 
              variant="delivery" 
              size="xl" 
              className="w-full"
              onClick={handleContinue}
              disabled={!isFormValid}
            >
              Start Shopping
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};