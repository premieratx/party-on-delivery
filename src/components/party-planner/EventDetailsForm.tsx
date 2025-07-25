import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface EventDetailsFormProps {
  eventName: string;
  details?: {
    numberOfPeople: number;
    drinkerType: 'light' | 'medium' | 'heavy';
    budget: number;
    drinkTypes: string[];
    eventDuration: number;
    beerTypes?: string[];
    wineTypes?: string[];
    liquorTypes?: string[];
    cocktailTypes?: string[];
  };
  onUpdate: (details: any) => void;
}

const getMaxPeople = (eventName: string) => {
  const suggestions = {
    'bachelor': 15, 'bachelorette': 15, 'wedding party': 200, 'corporate event': 100,
    'birthday': 50, 'graduation': 75, 'house party': 30, 'need delivery now': 20,
    'no reason': 25, 'Rehearsal Dinner': 50, 'Bachelor Party': 15, 'Bachelorette Party': 15,
    'Pre-Wedding Party': 100, 'Groomsman Suite': 8, 'Bridal Suite': 10,
    'Wedding Cocktail Hour': 200, 'Wedding Ceremony': 200, 'Wedding Reception': 200,
    'Post-Wedding Party': 150, 'Wedding After Party': 100
  };
  return suggestions[eventName] || 50;
};

export const EventDetailsForm = ({ eventName, details, onUpdate }: EventDetailsFormProps) => {
  const maxPeople = getMaxPeople(eventName);
  
  const [formData, setFormData] = useState({
    numberOfPeople: details?.numberOfPeople || 10,
    drinkerType: details?.drinkerType || 'medium' as 'light' | 'medium' | 'heavy',
    budget: details?.budget || 200,
    drinkTypes: details?.drinkTypes || [],
    eventDuration: details?.eventDuration || 4,
    beerTypes: details?.beerTypes || [],
    wineTypes: details?.wineTypes || [],
    liquorTypes: details?.liquorTypes || [],
    cocktailTypes: details?.cocktailTypes || []
  });

  useEffect(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const updateFormData = (updates: Partial<typeof formData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleDrinkType = (type: string) => {
    const newTypes = formData.drinkTypes.includes(type)
      ? formData.drinkTypes.filter(t => t !== type)
      : [...formData.drinkTypes, type];
    
    // Clear sub-types when main type is unselected
    if (formData.drinkTypes.includes(type) && !newTypes.includes(type)) {
      // Main type is being unselected, clear its sub-types
      if (type === 'beer') {
        updateFormData({ drinkTypes: newTypes, beerTypes: [] });
      } else if (type === 'wine') {
        updateFormData({ drinkTypes: newTypes, wineTypes: [] });
      } else if (type === 'liquor') {
        updateFormData({ drinkTypes: newTypes, liquorTypes: [] });
      } else if (type === 'cocktails') {
        updateFormData({ drinkTypes: newTypes, cocktailTypes: [] });
      }
    } else {
      updateFormData({ drinkTypes: newTypes });
    }
  };

  const toggleSubType = (mainType: string, subType: string) => {
    const key = `${mainType}Types` as keyof typeof formData;
    const current = formData[key] as string[] || [];
    const updated = current.includes(subType)
      ? current.filter(t => t !== subType)
      : [...current, subType];
    updateFormData({ [key]: updated });
  };

  const drinkTypeOptions = [
    { id: 'beer', label: 'Beer', icon: '🍺' },
    { id: 'wine', label: 'Wine', icon: '🍷' },
    { id: 'liquor', label: 'Liquor', icon: '🥃' },
    { id: 'cocktails', label: 'Cocktails', icon: '🍹' }
  ];

  const subTypeOptions = {
    beer: ['Light', 'Dark', 'Hoppy', 'Local', 'Mexican'],
    wine: ['Pinot Grigio', 'Chardonnay', 'Cabernet', 'Pinot Noir', 'Rosé'],
    liquor: ['Whiskey', 'Tequila', 'Gin', 'Rum', 'Vodka'],
    cocktails: ['Margarita', 'Spicy Margarita', 'Paloma', 'Cosmo', 'Rum Punch']
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold">{eventName}</h3>
        <p className="text-sm text-muted-foreground">Quick event details</p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Row 1: People & Duration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">People</Label>
              <div className="space-y-1">
                <Slider
                  value={[formData.numberOfPeople]}
                  onValueChange={(value) => updateFormData({ numberOfPeople: value[0] })}
                  max={maxPeople}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <Badge variant="secondary" className="text-xs">{formData.numberOfPeople}</Badge>
                  <span>{maxPeople}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Duration (hrs)</Label>
              <div className="space-y-1">
                <Slider
                  value={[formData.eventDuration]}
                  onValueChange={(value) => updateFormData({ eventDuration: value[0] })}
                  max={12}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <Badge variant="secondary" className="text-xs">{formData.eventDuration}hrs</Badge>
                  <span>12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Drinker Type & Budget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Drinker Type</Label>
              <div className="grid grid-cols-3 gap-1">
                {(['light', 'medium', 'heavy'] as const).map((type) => (
                  <Button
                    key={type}
                    variant={formData.drinkerType === type ? "default" : "outline"}
                    onClick={() => updateFormData({ drinkerType: type })}
                    className="h-8 text-xs px-2"
                  >
                    {type === 'light' && '1/hr'}
                    {type === 'medium' && '2/hr'}
                    {type === 'heavy' && '3/hr'}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Budget</Label>
              <div className="space-y-1">
                <Slider
                  value={[formData.budget]}
                  onValueChange={(value) => updateFormData({ budget: value[0] })}
                  max={maxPeople * 30}
                  min={50}
                  step={25}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$50</span>
                  <Badge variant="secondary" className="text-xs">${formData.budget}</Badge>
                  <span>${maxPeople * 30}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Drink Types */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Drink Types</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {drinkTypeOptions.map((option) => (
                <Button
                  key={option.id}
                  variant={formData.drinkTypes.includes(option.id) ? "default" : "outline"}
                  onClick={() => toggleDrinkType(option.id)}
                  className="h-8 text-xs flex items-center gap-1 px-2"
                >
                  <span className="text-sm">{option.icon}</span>
                  <span>{option.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Liquor sub-type selection only */}
          {formData.drinkTypes.includes('liquor') && (
            <div className="space-y-2">
              <Label className="text-xs font-medium capitalize text-muted-foreground">Liquor Types</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1">
                {subTypeOptions.liquor?.map((subType) => {
                  const subTypeArray = formData.liquorTypes || [];
                  return (
                    <Button
                      key={subType}
                      variant={subTypeArray.includes(subType) ? "default" : "outline"}
                      onClick={() => toggleSubType('liquor', subType)}
                      className="h-7 text-xs px-1 truncate"
                      title={subType}
                    >
                      {subType}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Compact Summary */}
          <div className="bg-muted/30 rounded p-3 mt-4">
            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div>
                <div className="font-medium">{formData.numberOfPeople}</div>
                <div className="text-muted-foreground">People</div>
              </div>
              <div>
                <div className="font-medium">{formData.eventDuration}h</div>
                <div className="text-muted-foreground">Duration</div>
              </div>
              <div>
                <div className="font-medium capitalize">{formData.drinkerType}</div>
                <div className="text-muted-foreground">Drinkers</div>
              </div>
              <div>
                <div className="font-medium">${formData.budget}</div>
                <div className="text-muted-foreground">Budget</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};