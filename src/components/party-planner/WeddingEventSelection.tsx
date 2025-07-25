import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface WeddingEventSelectionProps {
  selectedEvents: string[];
  onSelect: (events: string[]) => void;
}

const weddingEvents = [
  'Rehearsal Dinner',
  'Bachelor Party',
  'Bachelorette Party', 
  'Pre-Wedding Party',
  'Groomsman Suite',
  'Bridal Suite',
  'Wedding Cocktail Hour',
  'Wedding Ceremony',
  'Wedding Reception',
  'Post-Wedding Party',
  'Wedding After Party'
];

export const WeddingEventSelection = ({ selectedEvents, onSelect }: WeddingEventSelectionProps) => {
  const handleEventToggle = (event: string, checked: boolean) => {
    if (checked) {
      onSelect([...selectedEvents, event]);
    } else {
      onSelect(selectedEvents.filter(e => e !== event));
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-semibold text-center mb-6">
        Which wedding events do you need to plan drinks for?
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {weddingEvents.map((event) => (
          <div key={event} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted/50 border">
            <Checkbox
              id={event}
              checked={selectedEvents.includes(event)}
              onCheckedChange={(checked) => handleEventToggle(event, !!checked)}
            />
            <Label htmlFor={event} className="text-sm cursor-pointer flex-1 leading-tight">
              {event}
            </Label>
          </div>
        ))}
      </div>
      
      {selectedEvents.length > 0 && (
        <div className="mt-6 p-4 bg-primary/10 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Selected {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  );
};