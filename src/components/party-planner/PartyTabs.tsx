import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ShoppingCart, ArrowRight, ArrowLeft } from "lucide-react";
import { ProductSelection } from "./ProductSelection";
import { EventDetailsForm } from "./EventDetailsForm";
import { SearchIcon } from "@/components/common/SearchIcon";
import { CartWidget } from "./CartWidget";

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
  onBackToPartyType?: () => void; // Add callback for back button
}

export const PartyTabs = ({
  eventName,
  eventDetails,
  onUpdateEventDetails,
  onAddToCart,
  categorySelections,
  totalPartyBudget,
  runningTotal,
  onComplete,
  onBackToPartyType
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
    if (category === 'beer') return Math.ceil(categoryDrinks / 12); // cases
    if (category === 'wine') return Math.ceil(categoryDrinks / 5); // bottles (5 drinks each)
    if (category === 'liquor') return Math.ceil(categoryDrinks / 25); // bottles (25 drinks each)
    if (category === 'cocktails') return Math.ceil(categoryDrinks / 12); // kits (12 drinks each)
    
    return categoryDrinks;
  };

  const getUnitType = (category: string) => {
    if (category === 'beer') return 'Cases';
    if (category === 'wine') return 'bottles';
    if (category === 'liquor') return 'bottles';
    if (category === 'cocktails') return 'Cocktail Kits';
    return 'items';
  };

  const getTotalDrinksForCategory = (category: string) => {
    const recommendedQty = getRecommendedQuantity(category);
    if (category === 'beer') return recommendedQty * 12; // 12 beers per case
    if (category === 'wine') return recommendedQty * 5; // 5 glasses per bottle
    if (category === 'liquor') return recommendedQty * 25; // 25 drinks per bottle
    if (category === 'cocktails') return recommendedQty * 12; // 12 cocktails per kit
    return recommendedQty;
  };

  const getSelectedDrinksForCategory = (category: string) => {
    const items = categorySelections[category] || [];
    return items.reduce((total, item) => {
      // Parse package size from product title to get actual drink count
      const { packageSize } = { packageSize: '' }; // You might need to import parseProductTitle
      
      switch (category) {
        case 'beer':
          // Try to extract pack size (e.g., "12 Pack", "24 Pack")
          const beerMatch = item.title.match(/(\d+)\s*(pack|pk)/i);
          const beersPerPack = beerMatch ? parseInt(beerMatch[1]) : 12;
          return total + (item.quantity * beersPerPack);
        case 'wine':
          // 5 glasses per bottle (standard assumption)
          return total + (item.quantity * 5);
        case 'liquor':
          // 25 drinks per bottle (standard 750mL assumption)
          return total + (item.quantity * 25);
        case 'cocktails':
          // Extract drink count from title
          const cocktailMatch = item.title.match(/(\d+)\s*(drink|cocktail|serve)/i);
          const drinksPerKit = cocktailMatch ? parseInt(cocktailMatch[1]) : 12;
          return total + (item.quantity * drinksPerKit);
        default:
          return total + item.quantity;
      }
    }, 0);
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
        {/* Page Title */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">Party Planner Summary</h1>
          <h2 className="text-xl text-muted-foreground">
            {eventName} Event Overview
          </h2>
        </div>

        {/* Top Summary Bar - Updated Stats */}
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">
                  {Object.values(categorySelections).flat().reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Planner Cart</div>
              </div>
              <div>
                <div className="text-lg font-bold">
                  {/* This will be updated to show unified cart total */}
                  {Object.values(categorySelections).flat().reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <div className="text-xs text-muted-foreground">Total Cart</div>
              </div>
              <div>
                <div className="text-lg font-bold">${eventDetails.budget.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Total Budget</div>
              </div>
              <div>
                <div className="text-lg font-bold">${totalSpent.toFixed(2)}</div>
                <div className="text-xs text-muted-foreground">Total Spent</div>
              </div>
              <div>
                <div className={`text-lg font-bold ${remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${remainingBudget.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">Remaining Budget</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Summary Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {eventDetails.drinkTypes.map(category => {
                  const items = categorySelections[category] || [];
                  const recommendedQty = getRecommendedQuantity(category);
                  const unitType = getUnitType(category);
                  const totalRecommendedDrinks = getTotalDrinksForCategory(category);
                  const selectedDrinks = getSelectedDrinksForCategory(category);
                  
                  return (
                    <div key={category} className="space-y-1">
                      <div className="text-lg font-semibold capitalize">{category}</div>
                      <div className="text-sm text-muted-foreground">
                        {category === 'beer' && `${Math.ceil(selectedDrinks / 12)} ${unitType} (${selectedDrinks} Beers)`}
                        {category === 'wine' && `${Math.ceil(selectedDrinks / 5)} ${unitType} (~${selectedDrinks} glasses)`}
                        {category === 'liquor' && `${Math.ceil(selectedDrinks / 25)} ${unitType}`}
                        {category === 'cocktails' && `${Math.ceil(selectedDrinks / 12)} ${unitType} (~${selectedDrinks} Cocktails)`}
                        {!['beer', 'wine', 'liquor', 'cocktails'].includes(category) && `${items.reduce((sum, item) => sum + item.quantity, 0)} Selected`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {category === 'beer' && `${recommendedQty} ${unitType} (${totalRecommendedDrinks} Beers)`}
                        {category === 'wine' && `${recommendedQty} ${unitType} (~${totalRecommendedDrinks} glasses)`}
                        {category === 'liquor' && `${recommendedQty} ${unitType}`}
                        {category === 'cocktails' && `${recommendedQty} ${unitType} (~${totalRecommendedDrinks} Cocktails)`}
                        {!['beer', 'wine', 'liquor', 'cocktails'].includes(category) && `${recommendedQty} Recommended`}
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary - Desktop 4 columns, Mobile dropdowns */}
        <div className="hidden md:grid md:grid-cols-4 gap-4">
          {eventDetails.drinkTypes.map(category => {
            const items = categorySelections[category] || [];
            const categoryTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const recommendedQty = getRecommendedQuantity(category);
            const unitType = getUnitType(category);
            const totalRecommendedDrinks = getTotalDrinksForCategory(category);
            const selectedDrinks = getSelectedDrinksForCategory(category);

            return (
              <Card key={category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg capitalize text-center">{category}</CardTitle>
                  <div className="text-center text-sm text-muted-foreground">
                    {category === 'beer' && `${Math.ceil(selectedDrinks / 12)} ${unitType} Selected • ${recommendedQty} ${unitType} (${totalRecommendedDrinks} Beers) Recommended`}
                    {category === 'wine' && `${Math.ceil(selectedDrinks / 5)} ${unitType} Selected • ${recommendedQty} ${unitType} (~${totalRecommendedDrinks} glasses) Recommended`}
                    {category === 'liquor' && `${Math.ceil(selectedDrinks / 25)} ${unitType} Selected • ${recommendedQty} ${unitType} Recommended`}
                    {category === 'cocktails' && `${Math.ceil(selectedDrinks / 12)} ${unitType} Selected • ${recommendedQty} ${unitType} (~${totalRecommendedDrinks} Cocktails) Recommended`}
                    {!['beer', 'wine', 'liquor', 'cocktails'].includes(category) && `${items.reduce((sum, item) => sum + item.quantity, 0)} Selected • ${recommendedQty} Recommended`}
                  </div>
                  <div className="text-center font-bold text-lg">${categoryTotal.toFixed(2)}</div>
                </CardHeader>
                <CardContent className="pt-2">
                  {items.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center p-2 bg-muted/30 rounded">
                      No items selected
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {items.map((item, idx) => (
                        <div key={`${item.productId}-${idx}`} className="text-xs bg-muted/30 p-2 rounded">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-muted-foreground">×{item.quantity}</span>
                            <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mobile Order Summary - Collapsible */}
        <div className="md:hidden space-y-2">
          {eventDetails.drinkTypes.map(category => {
            const items = categorySelections[category] || [];
            const categoryTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const recommendedQty = getRecommendedQuantity(category);
            const unitType = getUnitType(category);
            const totalRecommendedDrinks = getTotalDrinksForCategory(category);
            const selectedDrinks = getSelectedDrinksForCategory(category);

            return (
              <Card key={category} className="overflow-hidden">
                <CardHeader 
                  className="pb-2 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    const content = document.getElementById(`mobile-${category}-content`);
                    if (content) {
                      content.style.display = content.style.display === 'none' ? 'block' : 'none';
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg capitalize">{category}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        {category === 'beer' && `${Math.ceil(selectedDrinks / 12)} ${unitType} Selected • ${recommendedQty} ${unitType} (${totalRecommendedDrinks} Beers) Recommended`}
                        {category === 'wine' && `${Math.ceil(selectedDrinks / 5)} ${unitType} Selected • ${recommendedQty} ${unitType} (~${totalRecommendedDrinks} glasses) Recommended`}
                        {category === 'liquor' && `${Math.ceil(selectedDrinks / 25)} ${unitType} Selected • ${recommendedQty} ${unitType} Recommended`}
                        {category === 'cocktails' && `${Math.ceil(selectedDrinks / 12)} ${unitType} Selected • ${recommendedQty} ${unitType} (~${totalRecommendedDrinks} Cocktails) Recommended`}
                        {!['beer', 'wine', 'liquor', 'cocktails'].includes(category) && `${items.reduce((sum, item) => sum + item.quantity, 0)} Selected • ${recommendedQty} Recommended`}
                      </div>
                    </div>
                    <div className="font-bold text-lg">${categoryTotal.toFixed(2)}</div>
                  </div>
                </CardHeader>
                <CardContent id={`mobile-${category}-content`} className="pt-2" style={{ display: 'none' }}>
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center p-3 bg-muted/30 rounded">
                      No items selected
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item, idx) => (
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
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Everything Good to Go Section */}
        <Card className="bg-gradient-to-r from-secondary/10 to-primary/10">
          <CardContent className="p-6 text-center">
            <h3 className="text-2xl font-bold mb-4">Everything Good to Go?</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => window.location.href = '/product-search'}
                className="flex-1 sm:flex-none"
              >
                Add More Stuff
              </Button>
              <Button 
                size="lg"
                onClick={() => window.location.href = '/checkout'}
                className="flex-1 sm:flex-none"
              >
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Calculate cart items for CartWidget - transform to match CartWidget interface
  const allCartItems = Object.values(categorySelections).flat().map(item => ({
    id: item.productId,
    productId: item.productId,
    title: item.title,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
    eventName: item.eventName,
    category: item.category
  }));

  return (
    <div className="w-full relative">
      {/* Cart Widget - Show running totals */}
      <CartWidget items={allCartItems} />
      
      {/* Sticky Header - Full Width on Mobile */}
      <div className="sticky top-0 z-40 bg-background border-b pb-2 -mx-2 px-2 md:mx-0 md:px-0">
        {/* Desktop: Search Icon + Tabs */}
        <div className="hidden md:flex items-center gap-2 mb-2">
          <SearchIcon size="md" variant="tabs" />
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
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
        </div>
        
        {/* Mobile: Just Tabs */}
        <div className="md:hidden">
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
        </div>

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
                eventName={eventName}
                category={category}
                subcategories={category === 'liquor' ? (eventDetails.liquorTypes || []) : []}
                recommendedQuantity={getRecommendedQuantity(category)}
                unitType={getUnitType(category)}
                budget={getCategoryBudget(category)}
                totalPartyBudget={totalPartyBudget}
                runningTotal={runningTotal}
                currentSelections={categorySelections[category] || []}
                onAddToCart={(eventName, category, items) => handleCategoryAddToCart(category, items)}
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