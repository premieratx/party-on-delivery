import React from 'react';
import { Label } from '@/components/ui/label';

interface TimeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  timeSlots: string[];
}

export const TimeSelector: React.FC<TimeSelectorProps> = ({ value, onChange, timeSlots }) => {
  return (
    <div className="space-y-2">
      <Label>Delivery Time *</Label>
      <p className="text-xs text-muted-foreground">
        Same-day delivery available with 1-hour advance notice.
      </p>
      {/* Mobile-optimized select dropdown */}
      <select
        value={value || ""}
        onChange={(e) => {
          console.log('✅ Time slot selected:', e.target.value);
          onChange(e.target.value);
        }}
        className="flex h-12 sm:h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none cursor-pointer"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 0.5rem center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '1.5em 1.5em',
          paddingRight: '2.5rem'
        }}
      >
        <option value="" disabled>Select a time slot</option>
        {timeSlots.map((slot) => (
          <option key={slot} value={slot}>
            {slot}
          </option>
        ))}
      </select>
      {timeSlots.length === 0 && (
        <div className="p-2 text-sm text-muted-foreground text-center bg-yellow-50 border border-yellow-200 rounded">
          No time slots available today. Please select a future date.
        </div>
      )}
    </div>
  );
};