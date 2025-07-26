import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Briefcase, Cake, GraduationCap, Clock, Home, PartyPopper } from "lucide-react";

interface PartyTypeSelectionProps {
  selectedType: string;
  onSelect: (type: string) => void;
}

const partyTypes = [
  { id: 'bachelor', label: 'Bachelor Party', icon: PartyPopper },
  { id: 'bachelorette', label: 'Bachelorette Party', icon: Heart },
  { id: 'wedding party', label: 'Wedding Party', icon: Heart },
  { id: 'corporate event', label: 'Corporate Event', icon: Briefcase },
  { id: 'birthday', label: 'Birthday Party', icon: Cake },
  { id: 'graduation', label: 'Graduation Party', icon: GraduationCap },
  { id: 'house party', label: 'House Party', icon: Home },
  { id: 'need delivery now', label: 'Need Delivery Now', icon: Clock },
  { id: 'no reason', label: 'No Reason - Just Party!', icon: PartyPopper },
];

export const PartyTypeSelection = ({ selectedType, onSelect }: PartyTypeSelectionProps) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-center mb-6">
        What kind of party are you throwing?
      </h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {partyTypes.map((type) => {
          const Icon = type.icon;
          return (
            <Card 
              key={type.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedType === type.id 
                  ? 'ring-2 ring-primary bg-primary/5' 
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onSelect(type.id)}
            >
              <CardContent className="p-4 md:p-6 text-center">
                <Icon className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-2 md:mb-3 text-primary" />
                <p className="font-medium text-xs md:text-sm">{type.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <div className="text-center">
        <Button 
          size="lg" 
          className="px-8 py-3 text-lg font-semibold"
          disabled={!selectedType}
        >
          Order Delivery Now
        </Button>
      </div>
    </div>
  );
};