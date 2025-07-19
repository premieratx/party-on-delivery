
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DeliveryInfo } from '../DeliveryWidget';

interface DeliverySchedulerProps {
  onComplete: (info: DeliveryInfo) => void;
  deliveryInfo: DeliveryInfo;
}

const timeSlots = [
  '12:00 PM - 1:00 PM',
  '1:00 PM - 2:00 PM', 
  '2:00 PM - 3:00 PM',
  '3:00 PM - 4:00 PM',
  '4:00 PM - 5:00 PM',
  '5:00 PM - 6:00 PM',
  '6:00 PM - 7:00 PM',
  '7:00 PM - 8:00 PM',
  '8:00 PM - 9:00 PM',
  '9:00 PM - 10:00 PM'
];

export const DeliveryScheduler: React.FC<DeliverySchedulerProps> = ({ onComplete, deliveryInfo }) => {
  const [date, setDate] = useState<Date | undefined>(deliveryInfo.date || undefined);
  const [timeSlot, setTimeSlot] = useState(deliveryInfo.timeSlot);

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
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Date Selection */}
            <div className="space-y-2">
              <Label className="text-base font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Delivery Date
              </Label>
              <Popover>
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
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
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
                <SelectTrigger>
                  <SelectValue placeholder="Select a time slot" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem key={slot} value={slot}>
                      {slot}
                    </SelectItem>
                  ))}
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
