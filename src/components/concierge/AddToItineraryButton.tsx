import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore, ItineraryItem } from '@/store/useAppStore';
import { useToast } from '@/hooks/use-toast';

interface AddToItineraryButtonProps {
  item: Omit<ItineraryItem, 'id'>;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function AddToItineraryButton({ 
  item, 
  variant = 'outline', 
  size = 'default',
  className 
}: AddToItineraryButtonProps) {
  const addToItinerary = useAppStore((state) => state.addToItinerary);
  const { toast } = useToast();

  const handleAddToItinerary = () => {
    const itineraryItem: ItineraryItem = {
      ...item,
      id: `${item.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
    
    addToItinerary(itineraryItem);
    
    toast({
      title: "Added to itinerary",
      description: `${item.title} has been added to your itinerary.`,
    });
  };

  return (
    <Button
      onClick={handleAddToItinerary}
      variant={variant}
      size={size}
      className={className}
    >
      <Calendar className="h-4 w-4 mr-2" />
      Add to Itinerary
    </Button>
  );
}
