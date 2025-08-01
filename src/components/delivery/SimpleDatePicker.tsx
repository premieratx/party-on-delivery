import React from 'react';
import { Label } from '@/components/ui/label';

interface SimpleDatePickerProps {
  value: string | Date | null;
  onChange: (date: string) => void;
  onTimeSlotReset: () => void;
}

export function SimpleDatePicker({ value, onChange, onTimeSlotReset }: SimpleDatePickerProps) {
  const today = new Date().toISOString().split('T')[0];
  const displayValue = value ? new Date(value).toISOString().split('T')[0] : '';

  return (
    <div className="space-y-2">
      <Label>Delivery Date *</Label>
      <input
        type="date"
        value={displayValue}
        min={today}
        onChange={(e) => {
          if (e.target.value) {
            const selectedDate = new Date(e.target.value + 'T00:00:00');
            onChange(selectedDate.toISOString());
            onTimeSlotReset(); // Reset time when date changes
            console.log('📅 Date selected:', selectedDate.toISOString());
          }
        }}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  );
}