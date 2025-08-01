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
      {/* Use native select for maximum reliability across all user types */}
      <select
        value={value || ""}
        onChange={(e) => {
          console.log('✅ Native select change triggered with value:', e.target.value);
          onChange(e.target.value);
        }}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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