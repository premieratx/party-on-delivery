import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Users, DollarSign, Clock } from "lucide-react";

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

const drinkOptions = [
  { id: 'beer', label: 'Beer' },
  { id: 'wine', label: 'Wine' },
  { id: 'liquor', label: 'Liquor/Spirits' },
  { id: 'cocktails', label: 'Cocktails' }
];

const beerTypes = ['Light Beer', 'Dark Beer', 'Hoppy/IPA', 'Local Craft', 'Mexican Beer'];
const wineTypes = ['Pinot Grigio', 'Chardonnay', 'Cabernet Sauvignon', 'Pinot Noir', 'Rosé'];
const liquorTypes = ['Whiskey', 'Tequila', 'Gin', 'Rum', 'Vodka'];
const cocktailTypes = ['Margarita', 'Spicy Margarita', 'Paloma', 'Cosmopolitan', 'Rum Punch'];

// Suggested max people by event type
const getMaxPeople = (eventName: string) => {
  const suggestions = {
    'bachelor': 15,
    'bachelorette': 15,
    'wedding party': 200,
    'corporate event': 100,
    'birthday': 50,
    'graduation': 75,
    'house party': 30,
    'need delivery now': 20,
    'no reason': 25,
    'Rehearsal Dinner': 50,
    'Bachelor Party': 15,
    'Bachelorette Party': 15,
    'Pre-Wedding Party': 100,
    'Groomsman Suite': 8,
    'Bridal Suite': 10,
    'Wedding Cocktail Hour': 200,
    'Wedding Ceremony': 200,
    'Wedding Reception': 200,
    'Post-Wedding Party': 150,
    'Wedding After Party': 100
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

  const handleDrinkTypeToggle = (type: string, checked: boolean) => {
    if (checked) {
      setFormData(prev => ({ ...prev, drinkTypes: [...prev.drinkTypes, type] }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        drinkTypes: prev.drinkTypes.filter(t => t !== type),
        // Clear subcategories when main type is unchecked
        [`${type}Types`]: []
      }));
    }
  };

  const handleSubTypeToggle = (category: string, type: string, checked: boolean) => {
    const field = `${category}Types` as keyof typeof formData;
    const current = formData[field] as string[] || [];
    
    if (checked) {
      setFormData(prev => ({ ...prev, [field]: [...current, type] }));
    } else {
      setFormData(prev => ({ ...prev, [field]: current.filter(t => t !== type) }));
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-semibold text-center">
        Let's plan drinks for: {eventName}
      </h2>

      {/* Number of People */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-5 h-5 text-primary" />
            <Label className="text-lg font-medium">How many people?</Label>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={formData.numberOfPeople}
                onChange={(e) => setFormData(prev => ({ ...prev, numberOfPeople: parseInt(e.target.value) || 1 }))}
                min="1"
                max={maxPeople}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">people</span>
            </div>
            
            <div className="px-2">
              <Slider
                value={[formData.numberOfPeople]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, numberOfPeople: value[0] }))}
                max={maxPeople}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span>{maxPeople}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drinker Type */}
      <Card>
        <CardContent className="p-6">
          <Label className="text-lg font-medium mb-4 block">What kind of drinkers are they?</Label>
          <RadioGroup
            value={formData.drinkerType}
            onValueChange={(value) => setFormData(prev => ({ ...prev, drinkerType: value as 'light' | 'medium' | 'heavy' }))}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="light" id="light" />
              <Label htmlFor="light">Light (1 drink/hour)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="medium" id="medium" />
              <Label htmlFor="medium">Medium (2 drinks/hour)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="heavy" id="heavy" />
              <Label htmlFor="heavy">Heavy (3 drinks/hour)</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Event Duration */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <Label className="text-lg font-medium">How many hours will the event last?</Label>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={formData.eventDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, eventDuration: parseInt(e.target.value) || 1 }))}
                min="1"
                max="12"
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">hours</span>
            </div>
            
            <div className="px-2">
              <Slider
                value={[formData.eventDuration]}
                onValueChange={(value) => setFormData(prev => ({ ...prev, eventDuration: value[0] }))}
                max={12}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1hr</span>
                <span>12hrs</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-primary" />
            <Label className="text-lg font-medium">What's your budget for drinks?</Label>
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-2xl font-semibold">$</span>
            <Input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: parseInt(e.target.value) || 0 }))}
              min="0"
              className="text-lg"
            />
          </div>
        </CardContent>
      </Card>

      {/* Drink Types */}
      <Card>
        <CardContent className="p-6">
          <Label className="text-lg font-medium mb-4 block">What types of drinks do you want?</Label>
          
          <div className="space-y-6">
            {drinkOptions.map((drink) => (
              <div key={drink.id} className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={drink.id}
                    checked={formData.drinkTypes.includes(drink.id)}
                    onCheckedChange={(checked) => handleDrinkTypeToggle(drink.id, !!checked)}
                  />
                  <Label htmlFor={drink.id} className="font-medium">{drink.label}</Label>
                </div>
                
                {formData.drinkTypes.includes(drink.id) && (
                  <div className="ml-6 pl-4 border-l-2 border-muted space-y-2">
                    {drink.id === 'beer' && beerTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`beer-${type}`}
                          checked={formData.beerTypes?.includes(type) || false}
                          onCheckedChange={(checked) => handleSubTypeToggle('beer', type, !!checked)}
                        />
                        <Label htmlFor={`beer-${type}`} className="text-sm">{type}</Label>
                      </div>
                    ))}
                    
                    {drink.id === 'wine' && wineTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`wine-${type}`}
                          checked={formData.wineTypes?.includes(type) || false}
                          onCheckedChange={(checked) => handleSubTypeToggle('wine', type, !!checked)}
                        />
                        <Label htmlFor={`wine-${type}`} className="text-sm">{type}</Label>
                      </div>
                    ))}
                    
                    {drink.id === 'liquor' && liquorTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`liquor-${type}`}
                          checked={formData.liquorTypes?.includes(type) || false}
                          onCheckedChange={(checked) => handleSubTypeToggle('liquor', type, !!checked)}
                        />
                        <Label htmlFor={`liquor-${type}`} className="text-sm">{type}</Label>
                      </div>
                    ))}
                    
                    {drink.id === 'cocktails' && cocktailTypes.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`cocktail-${type}`}
                          checked={formData.cocktailTypes?.includes(type) || false}
                          onCheckedChange={(checked) => handleSubTypeToggle('cocktails', type, !!checked)}
                        />
                        <Label htmlFor={`cocktail-${type}`} className="text-sm">{type}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};