import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Calculator } from "lucide-react";
import { useState } from "react";
import { ProductSelection } from "./ProductSelection";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [currentSelectionStep, setCurrentSelectionStep] = useState(0);
  const [allSelections, setAllSelections] = useState<Array<{eventName: string, category: string, items: any[]}>>([]);
  const [showProductSelection, setShowProductSelection] = useState(false);

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
    
    // Initialize recommendations
    const recommendations = {
      totalDrinks,
      beer: 0,
      wine: 0,
      liquor: 0,
      cocktails: 0
    };

    // Only calculate for selected drink types
    const selectedDrinkTypes = details.drinkTypes.filter((type: string) => 
      type === 'beer' || type === 'wine' || type === 'liquor' || type === 'cocktails'
    );

    if (selectedDrinkTypes.length === 0) {
      return { recommendations, containers: { beerCans: 0, wineBottles: 0, liquorBottles: 0, cocktailKits: 0 } };
    }

    // Divide drinks evenly among selected types
    const drinksPerType = Math.ceil(totalDrinks / selectedDrinkTypes.length);

    selectedDrinkTypes.forEach((type: string) => {
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

  // Generate all category selections needed
  const getAllCategorySelections = () => {
    const selections: Array<{
      eventName: string;
      category: string;
      subcategories: string[];
      recommendedQuantity: number;
      unitType: string;
      budget: number;
    }> = [];

    calculations.forEach(calc => {
      const eventBudget = calc.details.budget;
      const categoriesInEvent = calc.details.drinkTypes.length;
      const budgetPerCategory = eventBudget / categoriesInEvent;

      calc.details.drinkTypes.forEach((category: string) => {
        let subcategories: string[] = [];
        let recommendedQuantity = 0;
        let unitType = '';

        switch (category) {
          case 'beer':
            subcategories = calc.details.beerTypes && calc.details.beerTypes.length > 0 ? calc.details.beerTypes : ['Light'];
            recommendedQuantity = calc.recommendations.beer;
            unitType = 'cans';
            break;
          case 'wine':
            subcategories = calc.details.wineTypes && calc.details.wineTypes.length > 0 ? calc.details.wineTypes : ['Chardonnay'];
            recommendedQuantity = calc.containers.wineBottles;
            unitType = 'bottles';
            break;
          case 'liquor':
            subcategories = calc.details.liquorTypes && calc.details.liquorTypes.length > 0 ? calc.details.liquorTypes : ['Whiskey'];
            recommendedQuantity = calc.containers.liquorBottles;
            unitType = 'bottles';
            break;
          case 'cocktails':
            subcategories = calc.details.cocktailTypes && calc.details.cocktailTypes.length > 0 ? calc.details.cocktailTypes : ['Margarita'];
            recommendedQuantity = calc.containers.cocktailKits;
            unitType = 'kits';
            break;
        }

        // Only add selections if the main category has drinks allocated
        if (recommendedQuantity > 0) {
          selections.push({
            eventName: calc.eventName,
            category,
            subcategories,
            recommendedQuantity,
            unitType,
            budget: budgetPerCategory
          });
        }
      });
    });

    return selections;
  };

  const categorySelections = getAllCategorySelections();
  const currentSelection = categorySelections[currentSelectionStep];

  const handleAddToCart = (items: any[]) => {
    setAllSelections(prev => [...prev, {
      eventName: currentSelection.eventName,
      category: currentSelection.category,
      items
    }]);
    
    toast({
      title: "Added to selections!",
      description: `Added ${items.length} ${currentSelection.category} items`,
    });
  };

  const handleNextCategory = () => {
    if (currentSelectionStep < categorySelections.length - 1) {
      setCurrentSelectionStep(prev => prev + 1);
    } else {
      // All categories completed, show final summary
      toast({
        title: "All selections complete!",
        description: "Ready to add everything to your cart",
      });
    }
  };

  const getTotalSelectionCost = () => {
    return allSelections.reduce((total, selection) => 
      total + selection.items.reduce((itemTotal, item) => 
        itemTotal + (item.price * item.quantity), 0
      ), 0
    );
  };

  if (showProductSelection && currentSelection) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Select Your Products</h2>
          <p className="text-muted-foreground">
            Step {currentSelectionStep + 1} of {categorySelections.length}: {currentSelection.eventName} - {currentSelection.category}
          </p>
        </div>

        <ProductSelection
          category={currentSelection.category}
          subcategories={currentSelection.subcategories}
          recommendedQuantity={currentSelection.recommendedQuantity}
          unitType={currentSelection.unitType}
          budget={currentSelection.budget}
          onAddToCart={handleAddToCart}
          onComplete={handleNextCategory}
        />

        {/* Mini Cart Preview */}
        {allSelections.length > 0 && (
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Your Selections So Far</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                {allSelections.map((selection, index) => (
                  <div key={index} className="flex justify-between">
                    <span>{selection.eventName} - {selection.category}: {selection.items.length} items</span>
                    <span>${selection.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-medium">
                  <span>Total:</span>
                  <span>${getTotalSelectionCost().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentSelectionStep >= categorySelections.length - 1 && allSelections.length === categorySelections.length && (
          <Card className="bg-primary/5 border-primary/30">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-4">Ready to Checkout!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Total: ${getTotalSelectionCost().toFixed(2)} (Budget: ${totalBudget})
              </p>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate('/')} className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart & Checkout
                </Button>
                <Button variant="outline" onClick={() => setShowProductSelection(false)}>
                  Review Recommendations
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

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
                onClick={() => setShowProductSelection(true)}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Shop Recommended Products
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
              >
                Browse All Products
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