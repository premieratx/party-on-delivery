import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Calculator } from "lucide-react";

interface PartyRecommendationsProps {
  partyDetails: {
    partyType: string;
    weddingEvents?: string[];
    eventDetails: Record<string, {
      numberOfPeople: number;
      drinkerType: 'light' | 'medium' | 'heavy';
      budget: number;
      drinkTypes: string[];
      eventDuration: number;
      beerTypes?: string[];
      wineTypes?: string[];
      liquorTypes?: string[];
      cocktailTypes?: string[];
    }>;
  };
}

export const PartyRecommendations = ({ partyDetails }: PartyRecommendationsProps) => {
  const navigate = useNavigate();

  const getDrinksPerHour = (drinkerType: 'light' | 'medium' | 'heavy') => {
    switch (drinkerType) {
      case 'light': return 1;
      case 'medium': return 2;
      case 'heavy': return 3;
      default: return 2;
    }
  };

  const calculateRecommendations = (eventName: string, details: any) => {
    const drinksPerHour = getDrinksPerHour(details.drinkerType);
    const totalDrinks = details.numberOfPeople * details.eventDuration * drinksPerHour;
    const drinksPerType = Math.ceil(totalDrinks / details.drinkTypes.length);

    const recommendations = {
      totalDrinks,
      beer: 0,
      wine: 0,
      liquor: 0,
      cocktails: 0
    };

    details.drinkTypes.forEach((type: string) => {
      recommendations[type as keyof typeof recommendations] = drinksPerType;
    });

    // Convert to containers
    const containers = {
      beerCans: recommendations.beer, // 12oz cans
      wineBottles: Math.ceil(recommendations.wine / 5), // 5 glasses per bottle
      liquorBottles: Math.ceil(recommendations.liquor / 25), // 25 drinks per 750ml
      cocktailKits: Math.ceil(recommendations.cocktails / 12) // 12 drinks per kit
    };

    return { recommendations, containers };
  };

  const getEventsToCalculate = () => {
    if (partyDetails.partyType === 'wedding party' && partyDetails.weddingEvents) {
      return partyDetails.weddingEvents.filter(event => partyDetails.eventDetails[event]);
    }
    return [partyDetails.partyType];
  };

  const events = getEventsToCalculate();
  const calculations = events.map(event => ({
    eventName: event,
    details: partyDetails.eventDetails[event],
    ...calculateRecommendations(event, partyDetails.eventDetails[event])
  }));

  const totalBudget = calculations.reduce((sum, calc) => sum + calc.details.budget, 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Your Party Recommendations 🎉</h2>
        <p className="text-muted-foreground">
          Based on your preferences, here's what we recommend
        </p>
      </div>

      {calculations.map((calc, index) => (
        <Card key={index} className="border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <span>{calc.eventName}</span>
              <Badge variant="secondary">
                {calc.details.numberOfPeople} people • {calc.details.eventDuration}hrs • {calc.details.drinkerType} drinkers
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Drink Breakdown */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Calculator className="w-4 h-4" />
                  Recommended Drinks
                </h4>
                <div className="space-y-2">
                  {calc.details.drinkTypes.includes('beer') && (
                    <div className="flex justify-between">
                      <span>Beer (12oz cans):</span>
                      <span className="font-medium">{calc.recommendations.beer} cans</span>
                    </div>
                  )}
                  {calc.details.drinkTypes.includes('wine') && (
                    <div className="flex justify-between">
                      <span>Wine bottles (5 glasses each):</span>
                      <span className="font-medium">{calc.containers.wineBottles} bottles</span>
                    </div>
                  )}
                  {calc.details.drinkTypes.includes('liquor') && (
                    <div className="flex justify-between">
                      <span>Liquor bottles (750ml):</span>
                      <span className="font-medium">{calc.containers.liquorBottles} bottles</span>
                    </div>
                  )}
                  {calc.details.drinkTypes.includes('cocktails') && (
                    <div className="flex justify-between">
                      <span>Cocktail kits (12 drinks each):</span>
                      <span className="font-medium">{calc.containers.cocktailKits} kits</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Preferred Types */}
              <div>
                <h4 className="font-semibold mb-3">Your Preferences</h4>
                <div className="space-y-2 text-sm">
                  {calc.details.beerTypes && calc.details.beerTypes.length > 0 && (
                    <div>
                      <span className="font-medium">Beer types:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {calc.details.beerTypes.map((type, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {calc.details.wineTypes && calc.details.wineTypes.length > 0 && (
                    <div>
                      <span className="font-medium">Wine types:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {calc.details.wineTypes.map((type, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {calc.details.liquorTypes && calc.details.liquorTypes.length > 0 && (
                    <div>
                      <span className="font-medium">Liquor types:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {calc.details.liquorTypes.map((type, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {calc.details.cocktailTypes && calc.details.cocktailTypes.length > 0 && (
                    <div>
                      <span className="font-medium">Cocktail types:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {calc.details.cocktailTypes.map((type, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{type}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Budget for this event:</span>
                <span className="text-lg font-bold text-primary">${calc.details.budget}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary */}
      <Card className="bg-primary/5 border-primary/30">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Total Event Budget</h3>
            <p className="text-3xl font-bold text-primary">${totalBudget}</p>
            <p className="text-sm text-muted-foreground">
              Ready to shop for your {events.length > 1 ? 'events' : 'event'}? 
              We'll help you find the perfect products within your budget!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
              <Button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Shop Now
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Plan Another Party
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};