import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ShoppingCart, ArrowRight, ArrowLeft } from "lucide-react";
import { ProductSelection } from "./ProductSelection";
import { EventDetailsForm } from "./EventDetailsForm";

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  eventName: string;
  category: string;
}

interface PartyTabsProps {
  eventName: string;
  eventDetails: {
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
  onUpdateEventDetails: (details: any) => void;
  onAddToCart: (eventName: string, category: string, items: CartItem[]) => void;
  categorySelections: Record<string, CartItem[]>;
  totalPartyBudget: number;
  runningTotal: number;
  onComplete: () => void;
}

export const PartyTabs = ({
  eventName,
  eventDetails,
  onUpdateEventDetails,
  onAddToCart,
  categorySelections,
  totalPartyBudget,
  runningTotal,
  onComplete
}: PartyTabsProps) => {
  const [activeTab, setActiveTab] = useState("details");
  const [completedTabs, setCompletedTabs] = useState<Set<string>>(new Set());
  const [tabStates, setTabStates] = useState<{[key: string]: 'saved' | 'added'}>({});

  // Generate tabs based on selected drink types
  const tabs = [
    { id: "details", label: "Event Details", type: "details" },
    ...eventDetails.drinkTypes.map(type => ({
      id: type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      type: "category"
    })),
    { id: "summary", label: "Summary", type: "summary" }
  ];

  // Update live calculations when event details change
  useEffect(() => {
    onUpdateEventDetails(eventDetails);
  }, [eventDetails, onUpdateEventDetails]);

  const isTabCompleted = (tabId: string) => {
    if (tabId === "details") {
      return eventDetails.numberOfPeople > 0 && 
             eventDetails.budget > 0 && 
             eventDetails.drinkTypes.length > 0 &&
             eventDetails.eventDuration > 0;
    }
    if (tabId === "summary") {
      return eventDetails.drinkTypes.every(type => 
        categorySelections[type] && categorySelections[type].length > 0
      );
    }
    return categorySelections[tabId] && categorySelections[tabId].length > 0;
  };

  const getTabState = (tabId: string) => {
    return tabStates[tabId] || null;
  };

  const handleTabSave = (tabId: string, isAddedToCart: boolean = false) => {
    setCompletedTabs(prev => new Set([...prev, tabId]));
    setTabStates(prev => ({
      ...prev,
      [tabId]: isAddedToCart ? 'added' : 'saved'
    }));
    
    // Ensure the updated state persists
    onUpdateEventDetails(eventDetails);
  };

  const handleCategoryAddToCart = (category: string, items: CartItem[]) => {
    console.log('PartyTabs: Adding to cart for category:', category, 'items:', items);
    onAddToCart(eventName, category, items);
    handleTabSave(category, true);
    console.log('PartyTabs: Cart updated, tab saved as added');
  };

  const handleNextTab = () => {
    const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
    if (currentIndex < tabs.length - 1) {
      setActiveTab(tabs[currentIndex + 1].id);
    } else {
      onComplete();
    }
  };

  const canProceedToNext = () => {
    if (activeTab === "details") {
      return isTabCompleted("details");
    }
    return true; // Allow proceeding even without adding to cart
  };

  const getRecommendedQuantity = (category: string) => {
    const { numberOfPeople, drinkerType, eventDuration, drinkTypes } = eventDetails;
    
    let drinksPerPersonPerHour = 0.5;
    if (drinkerType === 'light') drinksPerPersonPerHour = 0.5;
    else if (drinkerType === 'medium') drinksPerPersonPerHour = 1;
    else if (drinkerType === 'heavy') drinksPerPersonPerHour = 1.5;
    
    const totalDrinks = numberOfPeople * drinksPerPersonPerHour * eventDuration;
    const categoryRatio = 1 / drinkTypes.length;
    const categoryDrinks = Math.ceil(totalDrinks * categoryRatio);

    // Convert to containers
    if (category === 'beer') return Math.ceil(categoryDrinks / 12); // 12-packs
    if (category === 'wine') return Math.ceil(categoryDrinks / 5); // bottles (5 drinks each)
    if (category === 'liquor') return Math.ceil(categoryDrinks / 25); // bottles (25 drinks each)
    if (category === 'cocktails') return Math.ceil(categoryDrinks / 12); // kits (12 drinks each)
    
    return categoryDrinks;
  };

  const getUnitType = (category: string) => {
    if (category === 'beer') return '12-packs';
    if (category === 'wine') return 'bottles';
    if (category === 'liquor') return 'bottles';
    if (category === 'cocktails') return 'drinks';
    return 'items';
  };

  const getCategoryBudget = (category: string) => {
    const categoryRatio = 1 / eventDetails.drinkTypes.length;
    return eventDetails.budget * categoryRatio;
  };

  const renderSummary = () => {
    console.log('Rendering summary with categorySelections:', categorySelections);
    console.log('Event details drink types:', eventDetails.drinkTypes);
    
    const totalSpent = Object.values(categorySelections).flat().reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );
    const remainingBudget = eventDetails.budget - totalSpent;

    return (
      <div className="space-y-6">
        {/* Top Summary Bar */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">
                  {Object.values(categorySelections).flat().reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Items Selected</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {eventDetails.drinkTypes.map(category => getRecommendedQuantity(category)).reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Recommended Total</div>
              </div>
              <div>
                <div className={`text-lg font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${remainingBudget.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Remaining Budget</div>
              </div>
              <div>
                <div className="text-lg font-bold">${totalSpent.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Total Cost</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Event Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{eventName} Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Event Info */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-lg font-bold">{eventDetails.numberOfPeople}</div>
                    <div className="text-xs text-muted-foreground">Guests</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-lg font-bold capitalize">{eventDetails.drinkerType}</div>
                    <div className="text-xs text-muted-foreground">Drinker Type</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-lg font-bold">{eventDetails.eventDuration}h</div>
                    <div className="text-xs text-muted-foreground">Duration</div>
                  </div>
                  <div className="text-center p-3 bg-muted/50 rounded">
                    <div className="text-lg font-bold">{eventDetails.drinkTypes.length}</div>
                    <div className="text-xs text-muted-foreground">Categories</div>
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => window.history.back()}
                  className="flex-1"
                >
                  Back to Party Type
                </Button>
                <Button 
                  onClick={onComplete} 
                  className="flex-1"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right Side - Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {eventDetails.drinkTypes.map(category => {
                console.log(`Processing category: ${category}`);
                console.log(`Category selections:`, categorySelections[category]);
                
                const items = categorySelections[category] || [];
                const categoryTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const recommendedQty = getRecommendedQuantity(category);
                const actualQty = items.reduce((sum, item) => sum + item.quantity, 0);

                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <h5 className="font-medium capitalize text-base">{category}</h5>
                        <div className="text-xs text-muted-foreground">
                          {actualQty} selected • {recommendedQty} recommended
                        </div>
                      </div>
                      <span className="font-bold text-lg">${categoryTotal.toFixed(2)}</span>
                    </div>
                    {items.length === 0 ? (
                      <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded text-center">
                        No items selected
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {items.map((item, idx) => {
                          console.log(`Rendering item ${idx}:`, item);
                          return (
                            <div key={`${item.productId}-${idx}`} className="flex justify-between items-center text-sm bg-muted/30 p-2 rounded">
                              <div className="flex-1">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs">×{item.quantity}</span>
                                <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                  <span>Total</span>
                  <span>${totalSpent.toFixed(2)}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Budget: ${eventDetails.budget.toFixed(2)} • 
                  Remaining: <span className={remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${remainingBudget.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Sticky Header - Full Width on Mobile */}
      <div className="sticky top-0 z-40 bg-background border-b pb-2 -mx-2 px-2 md:mx-0 md:px-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full overflow-x-auto bg-background border-2 border-black shadow-lg" style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)`, height: '60px' }}>
            {tabs.map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="relative flex flex-col items-center justify-center text-xs px-1 py-1 h-full border-r border-black last:border-r-0 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-200 hover:bg-muted/50"
              >
                <div className="flex items-center gap-1 mb-1">
                  {isTabCompleted(tab.id) && (
                    <Check className="w-3 h-3 text-green-500" />
                  )}
                  <span className="font-semibold text-xs text-center leading-tight md:whitespace-nowrap" style={{ fontSize: '80%' }}>
                    {tab.id === 'details' ? (
                      <span className="block md:inline">
                        <span className="block md:inline">Event</span>
                        <span className="block md:inline md:ml-1">Details</span>
                      </span>
                    ) : tab.label}
                  </span>
                </div>
                {getTabState(tab.id) === 'added' && (
                  <Check className="w-3 h-3 text-green-500" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Navigation Arrows - Smaller */}
        <div className="flex justify-between items-center mt-1 px-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const currentIndex = tabs.findIndex(tab => tab.id === activeTab);
              if (currentIndex > 0) {
                setActiveTab(tabs[currentIndex - 1].id);
              }
            }}
            disabled={tabs.findIndex(tab => tab.id === activeTab) === 0}
            className="flex items-center gap-1 h-6 px-2 text-xs"
          >
            <ArrowLeft className="w-3 h-3" />
            <span className="text-xs">Prev</span>
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextTab}
            disabled={tabs.findIndex(tab => tab.id === activeTab) === tabs.length - 1}
            className="flex items-center gap-1 h-6 px-2 text-xs"
          >
            <span className="text-xs">Next</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>

      <div className="mt-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="details" className="mt-0">
            {/* Centered Party Type Heading */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-green-600 uppercase tracking-wide">
                Plan Your {eventName.replace(/\b\w/g, l => l.toUpperCase())} Drinks
              </h2>
            </div>
            
            <EventDetailsForm
              eventName={eventName}
              details={eventDetails}
              onUpdate={onUpdateEventDetails}
            />
            <div className="flex justify-end mt-4">
              <Button 
                onClick={() => {
                  handleTabSave("details");
                  handleNextTab();
                }}
                disabled={!canProceedToNext()}
              >
                Save & Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </TabsContent>

          {eventDetails.drinkTypes.map(category => (
            <TabsContent key={category} value={category} className="mt-0">
              {/* Centered Party Type Heading */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-green-600 uppercase tracking-wide">
                  Plan Your {eventName.replace(/\b\w/g, l => l.toUpperCase())} Drinks
                </h2>
              </div>
              
              <ProductSelection
                category={category}
                subcategories={category === 'liquor' ? (eventDetails.liquorTypes || []) : []}
                recommendedQuantity={getRecommendedQuantity(category)}
                unitType={getUnitType(category)}
                budget={getCategoryBudget(category)}
                totalPartyBudget={totalPartyBudget}
                runningTotal={runningTotal}
                currentSelections={categorySelections[category] || []}
                onAddToCart={(items) => handleCategoryAddToCart(category, items)}
                onComplete={() => {
                  if (!isTabCompleted(category)) {
                    handleTabSave(category);
                  }
                  handleNextTab();
                }}
              />
            </TabsContent>
          ))}

          <TabsContent value="summary" className="mt-0">
            {renderSummary()}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};