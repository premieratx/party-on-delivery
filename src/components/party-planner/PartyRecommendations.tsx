import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Calculator, Mail, Send } from "lucide-react";
import { useState } from "react";
import { ProductSelection } from "./ProductSelection";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  eventName: string;
  category: string;
}

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
    categorySelections?: Record<string, Record<string, CartItem[]>>;
  };
  cart: CartItem[];
  onEditCategory: (event: string, category: string) => void;
}

export const PartyRecommendations = ({ partyDetails, cart, onEditCategory }: PartyRecommendationsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentSelectionStep, setCurrentSelectionStep] = useState(0);
  const [allSelections, setAllSelections] = useState<Array<{eventName: string, category: string, items: any[]}>>([]);
  const [savedCategorySelections, setSavedCategorySelections] = useState<Record<string, any[]>>({});
  const [showProductSelection, setShowProductSelection] = useState(false);
  const [showFinalProposal, setShowFinalProposal] = useState(false);
  const [email, setEmail] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

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
      return { recommendations, containers: { beer12Packs: 0, wineBottles: 0, liquorBottles: 0, cocktailKits: 0 } };
    }

    // Divide drinks evenly among selected types
    const drinksPerType = Math.ceil(totalDrinks / selectedDrinkTypes.length);

    selectedDrinkTypes.forEach((type: string) => {
      recommendations[type as keyof typeof recommendations] = drinksPerType;
    });

    // Convert to containers
    const containers = {
      beer12Packs: Math.ceil(recommendations.beer / 12), // 12-packs for beer
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
            unitType = 'beers';
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
    const selectionKey = `${currentSelection.eventName}-${currentSelection.category}`;
    
    // Update category selections for navigation
    setSavedCategorySelections(prev => ({
      ...prev,
      [selectionKey]: items
    }));
    
    // Update or add to allSelections
    setAllSelections(prev => {
      const existingIndex = prev.findIndex(
        s => s.eventName === currentSelection.eventName && s.category === currentSelection.category
      );
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          eventName: currentSelection.eventName,
          category: currentSelection.category,
          items
        };
        return updated;
      } else {
        return [...prev, {
          eventName: currentSelection.eventName,
          category: currentSelection.category,
          items
        }];
      }
    });
    
    toast({
      title: "Added to selections!",
      description: `Added ${items.length} ${currentSelection.category} items`,
    });
  };

  const handleNextCategory = () => {
    if (currentSelectionStep < categorySelections.length - 1) {
      setCurrentSelectionStep(prev => prev + 1);
    } else {
      // All categories completed, show final proposal
      setShowFinalProposal(true);
      toast({
        title: "All selections complete!",
        description: "Review your final proposal",
      });
    }
  };

  const handlePreviousCategory = () => {
    if (currentSelectionStep > 0) {
      setCurrentSelectionStep(prev => prev - 1);
    }
  };

  const navigateToCategory = (eventName: string, category: string) => {
    const targetIndex = categorySelections.findIndex(
      sel => sel.eventName === eventName && sel.category === category
    );
    if (targetIndex !== -1) {
      setCurrentSelectionStep(targetIndex);
      setShowProductSelection(true);
    }
  };

  const getCurrentSelections = () => {
    if (!currentSelection) return [];
    const selectionKey = `${currentSelection.eventName}-${currentSelection.category}`;
    return savedCategorySelections[selectionKey] || [];
  };

  const handleSendProposal = async () => {
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    setSendingEmail(true);
    try {
      // Format the proposal data
      const proposalData = {
        eventType: partyDetails.partyType,
        events: calculations.map(calc => ({
          eventName: calc.eventName,
          numberOfPeople: calc.details.numberOfPeople,
          drinkerType: calc.details.drinkerType,
          budget: calc.details.budget,
          eventDuration: calc.details.eventDuration,
          drinkTypes: calc.details.drinkTypes,
          recommendations: {
            beerCans: calc.recommendations.beer,
            wineBottles: calc.containers.wineBottles,
            liquorBottles: calc.containers.liquorBottles,
            cocktailKits: calc.containers.cocktailKits,
          },
          selectedItems: allSelections
            .filter(selection => selection.eventName === calc.eventName)
            .map(selection => ({
              category: selection.category,
              items: selection.items,
              totalCost: selection.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            }))
        })),
        totalBudget,
        totalSpent: getTotalSelectionCost()
      };

      const { error } = await supabase.functions.invoke('send-proposal', {
        body: { email, proposal: proposalData }
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: "Your party proposal has been sent to your email",
      });
      setEmail("");
    } catch (error) {
      console.error('Error sending proposal:', error);
      toast({
        title: "Error sending email",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setSendingEmail(false);
    }
  };

  const getTotalSelectionCost = () => {
    return allSelections.reduce((total, selection) => 
      total + selection.items.reduce((itemTotal, item) => 
        itemTotal + (item.price * item.quantity), 0
      ), 0
    );
  };

  const getPartyRunningTotal = (partyType: string) => {
    return allSelections
      .filter(selection => selection.eventName === partyType)
      .reduce((total, selection) => 
        total + selection.items.reduce((itemTotal, item) => 
          itemTotal + (item.price * item.quantity), 0
        ), 0
      );
  };

  if (showProductSelection && currentSelection) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">{currentSelection.eventName}</h1>
          <h2 className="text-xl text-muted-foreground mb-4">Choose Your Drinks</h2>
          <p className="text-sm text-muted-foreground">
            Step {currentSelectionStep + 1} of {categorySelections.length}: {currentSelection.category} selection
          </p>
        </div>

        <ProductSelection
          category={currentSelection.category}
          subcategories={currentSelection.subcategories}
          recommendedQuantity={currentSelection.recommendedQuantity}
          unitType={currentSelection.unitType}
          budget={currentSelection.budget}
          totalPartyBudget={calculations.find(c => c.eventName === currentSelection.eventName)?.details.budget || 0}
          runningTotal={getPartyRunningTotal(currentSelection.eventName)}
          currentSelections={getCurrentSelections()}
          onAddToCart={handleAddToCart}
          onComplete={handleNextCategory}
          onPrevious={currentSelectionStep > 0 ? handlePreviousCategory : undefined}
        />

        {/* Navigation & Progress */}
        <Card className="border-primary/20">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="text-sm">
                <div className="font-semibold">Category Progress</div>
                <div className="text-muted-foreground">Step {currentSelectionStep + 1} of {categorySelections.length}</div>
              </div>
              <div className="flex gap-2">
                {currentSelectionStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePreviousCategory}>
                    Previous
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setShowProductSelection(false)}>
                  Review All
                </Button>
              </div>
            </div>
            
            {/* Category Summary for Current Event */}
            {(() => {
              const currentEventSelections = allSelections.filter(s => s.eventName === currentSelection.eventName);
              const currentEventBudget = calculations.find(c => c.eventName === currentSelection.eventName)?.details.budget || 0;
              const currentEventSpent = getPartyRunningTotal(currentSelection.eventName);
              const currentEventRecs = calculations.find(c => c.eventName === currentSelection.eventName);
              
              return currentEventSelections.length > 0 && (
                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="font-medium">{currentSelection.eventName} Summary:</div>
                  {currentEventSelections.map((selection, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <button 
                        onClick={() => navigateToCategory(selection.eventName, selection.category)}
                        className="text-left hover:text-primary transition-colors"
                      >
                        <span className="capitalize">{selection.category}: {selection.items.length} items</span>
                        <div className="text-xs text-muted-foreground">
                          {selection.category === 'beer' && `${selection.items.reduce((sum, item) => sum + item.quantity, 0)} 12-packs (${selection.items.reduce((sum, item) => sum + ((item.containerSize || 12) * item.quantity), 0)} beers)`}
                          {selection.category === 'wine' && `${selection.items.reduce((sum, item) => sum + item.quantity, 0)} bottles`}
                          {selection.category === 'liquor' && `${selection.items.reduce((sum, item) => sum + item.quantity, 0)} bottles`}
                          {selection.category === 'cocktails' && `${selection.items.reduce((sum, item) => sum + item.quantity, 0)} kits`}
                          {' vs '}
                          {selection.category === 'beer' && `${currentEventRecs?.containers.beer12Packs || 0} recommended`}
                          {selection.category === 'wine' && `${currentEventRecs?.containers.wineBottles || 0} recommended`}
                          {selection.category === 'liquor' && `${currentEventRecs?.containers.liquorBottles || 0} recommended`}
                          {selection.category === 'cocktails' && `${currentEventRecs?.containers.cocktailKits || 0} recommended`}
                        </div>
                      </button>
                      <span className="font-medium">${selection.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="border-t pt-2 flex justify-between font-medium">
                    <span>Event Total: ${currentEventSpent.toFixed(2)} / ${currentEventBudget.toFixed(2)}</span>
                    <span className={currentEventSpent <= currentEventBudget ? 'text-green-600' : 'text-red-500'}>
                      {currentEventSpent <= currentEventBudget ? 'Within Budget' : 'Over Budget'}
                    </span>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>

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

  if (showFinalProposal) {
    const eventTypeDisplay = partyDetails.partyType === 'wedding party' ? 'Wedding Celebration' : 
      partyDetails.partyType.charAt(0).toUpperCase() + partyDetails.partyType.slice(1);

    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-2">🎉 Your Party Proposal</h2>
          <h3 className="text-2xl text-primary mb-4">{eventTypeDisplay}</h3>
          <p className="text-muted-foreground">
            Complete proposal ready for your event planning
          </p>
        </div>

        {/* Budget Overview */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-primary">${totalBudget}</div>
                <div className="text-sm text-muted-foreground">Total Budget</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">${getTotalSelectionCost().toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Selected</div>
              </div>
              <div>
                <div className={`text-3xl font-bold ${getTotalSelectionCost() <= totalBudget ? 'text-green-600' : 'text-red-500'}`}>
                  {getTotalSelectionCost() <= totalBudget ? '✓ Within Budget' : `$${(getTotalSelectionCost() - totalBudget).toFixed(2)} Over`}
                </div>
                <div className="text-sm text-muted-foreground">Budget Status</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Details */}
        {calculations.map((calc, index) => (
          <Card key={index} className="border-primary/20">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-xl">{calc.eventName}</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">{calc.details.numberOfPeople}</div>
                  <div className="text-xs text-muted-foreground">People</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">{calc.details.eventDuration}</div>
                  <div className="text-xs text-muted-foreground">Hours</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-2xl font-bold capitalize">{calc.details.drinkerType}</div>
                  <div className="text-xs text-muted-foreground">Drinkers</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded">
                  <div className="text-2xl font-bold">${calc.details.budget}</div>
                  <div className="text-xs text-muted-foreground">Budget</div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="font-semibold mb-2">Recommended Quantities</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  {calc.recommendations.beer > 0 && (
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="font-bold">{calc.recommendations.beer}</div>
                      <div className="text-xs">Beer Cans</div>
                    </div>
                  )}
                  {calc.containers.wineBottles > 0 && (
                    <div className="p-2 bg-purple-50 rounded">
                      <div className="font-bold">{calc.containers.wineBottles}</div>
                      <div className="text-xs">Wine Bottles</div>
                    </div>
                  )}
                  {calc.containers.liquorBottles > 0 && (
                    <div className="p-2 bg-amber-50 rounded">
                      <div className="font-bold">{calc.containers.liquorBottles}</div>
                      <div className="text-xs">Liquor Bottles</div>
                    </div>
                  )}
                  {calc.containers.cocktailKits > 0 && (
                    <div className="p-2 bg-green-50 rounded">
                      <div className="font-bold">{calc.containers.cocktailKits}</div>
                      <div className="text-xs">Cocktail Kits</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Products */}
              {allSelections.filter(s => s.eventName === calc.eventName).length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Selected Products</h4>
                  {allSelections
                    .filter(s => s.eventName === calc.eventName)
                    .map((selection, idx) => {
                      const categoryTotal = selection.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      return (
                        <div key={idx} className="mb-3 p-3 border rounded">
                          <div className="flex justify-between items-center mb-2">
                            <h5 className="font-medium capitalize">{selection.category}</h5>
                            <span className="font-bold">${categoryTotal.toFixed(2)}</span>
                          </div>
                          <div className="space-y-1 text-sm">
                            {selection.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="flex justify-between">
                                <span>{item.quantity}x {item.title}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {/* Email Proposal Section */}
        <Card className="bg-primary/5 border-primary/30">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <Mail className="w-12 h-12 mx-auto text-primary" />
              <h3 className="text-xl font-semibold">Email This Proposal</h3>
              <p className="text-sm text-muted-foreground">
                Get a beautifully formatted copy of your party proposal sent to your email
              </p>
              
              <div className="max-w-md mx-auto space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendProposal}
                    disabled={sendingEmail || !email}
                    className="flex items-center gap-2"
                  >
                    {sendingEmail ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send you a detailed proposal with all your selections and recommendations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-4">Ready to Order?</h3>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
                size="lg"
              >
                <ShoppingCart className="w-5 h-5" />
                Add Selected Items to Cart
              </Button>
              <Button 
                variant="outline"
                onClick={() => setShowFinalProposal(false)}
                size="lg"
              >
                Edit Selections
              </Button>
              <Button 
                variant="outline"
                onClick={() => window.location.reload()}
                size="lg"
              >
                Plan Another Party
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleEditParty = (eventIndex: number) => {
    const eventToEdit = events[eventIndex];
    // Set the current selection step to the first category for this event
    const firstCategoryIndex = categorySelections.findIndex(sel => sel.eventName === eventToEdit);
    if (firstCategoryIndex !== -1) {
      setCurrentSelectionStep(firstCategoryIndex);
      setShowProductSelection(true);
    }
  };

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
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {calc.details.numberOfPeople} people • {calc.details.eventDuration}hrs • {calc.details.drinkerType} drinkers
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleEditParty(index)}
                  className="text-xs"
                >
                  Edit
                </Button>
              </div>
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