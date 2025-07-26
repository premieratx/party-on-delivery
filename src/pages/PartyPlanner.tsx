import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight, Minimize2, ShoppingCart } from "lucide-react";
import { useReliableStorage } from "@/hooks/useReliableStorage";
import { PartyTypeSelection } from "@/components/party-planner/PartyTypeSelection";
import { WeddingEventSelection } from "@/components/party-planner/WeddingEventSelection";
import { PartyTabs } from "@/components/party-planner/PartyTabs";
import { CartWidget } from "@/components/party-planner/CartWidget";
import { SearchIcon } from "@/components/common/SearchIcon";

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image?: string;
  eventName: string;
  category: string;
}

export interface PartyDetails {
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
}

export const PartyPlanner = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [cartFlash, setCartFlash] = useState(false);
  const [partyDetails, setPartyDetails, clearPartyDetails] = useReliableStorage<PartyDetails>('party-details', {
    partyType: '',
    eventDetails: {},
    categorySelections: {}
  });

  const [cart, setCart] = useState<CartItem[]>([]);
  const [completedEvents, setCompletedEvents] = useState<Set<string>>(new Set());
  const [minimizedEvents, setMinimizedEvents] = useState<Set<string>>(new Set());

  const getEventsToProcess = () => {
    if (partyDetails.partyType === 'wedding party' && partyDetails.weddingEvents) {
      return partyDetails.weddingEvents;
    }
    return partyDetails.partyType ? [partyDetails.partyType] : [];
  };

  const addToCart = (eventName: string, category: string, items: CartItem[]) => {
    console.log('PartyPlanner: Adding to cart for event:', eventName, 'category:', category, 'items:', items);
    
    const newItems = items.map(item => ({
      ...item,
      eventName,
      category
    }));
    
    setCart(prev => {
      // Remove existing items for this event/category combination
      const filtered = prev.filter(item => 
        !(item.eventName === eventName && item.category === category)
      );
      const newCart = [...filtered, ...newItems];
      console.log('PartyPlanner: Cart updated from', prev.length, 'to', newCart.length, 'items');
      return newCart;
    });

    // Update category selections in partyDetails
    setPartyDetails(prev => {
      const updatedDetails = {
        ...prev,
        categorySelections: {
          ...prev.categorySelections,
          [eventName]: {
            ...prev.categorySelections?.[eventName],
            [category]: newItems
          }
        }
      };
      console.log('PartyPlanner: Updated party details categorySelections:', updatedDetails.categorySelections);
      return updatedDetails;
    });

    // Trigger cart flash animation
    setCartFlash(true);
    setTimeout(() => setCartFlash(false), 600);
  };

  const updatePartyDetails = (updates: Partial<PartyDetails>) => {
    setPartyDetails(prev => ({ ...prev, ...updates }));
  };

  const updateEventDetails = (eventName: string, details: PartyDetails['eventDetails'][string]) => {
    setPartyDetails(prev => ({
      ...prev,
      eventDetails: {
        ...prev.eventDetails,
        [eventName]: details
      }
    }));
  };

  const handleEventComplete = (eventName: string) => {
    setCompletedEvents(prev => new Set([...prev, eventName]));
    setMinimizedEvents(prev => new Set([...prev, eventName]));
    
    // Auto-scroll to next event if on desktop
    if (window.innerWidth >= 768) {
      setTimeout(() => {
        const nextEventElement = document.querySelector(`[data-event="${getEventsToProcess()[getEventsToProcess().indexOf(eventName) + 1]}"]`);
        if (nextEventElement) {
          nextEventElement.scrollIntoView({ behavior: 'smooth' });
        }
      }, 500);
    }
  };

  const toggleEventMinimized = (eventName: string) => {
    setMinimizedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventName)) {
        newSet.delete(eventName);
      } else {
        newSet.add(eventName);
      }
      return newSet;
    });
  };

  const getTotalPartyBudget = () => {
    return Object.values(partyDetails.eventDetails).reduce((sum, details) => sum + details.budget, 0);
  };

  const getRunningTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getCurrentStepType = () => {
    if (currentStep === 0) return 'party-type';
    if (partyDetails.partyType === 'wedding party' && currentStep === 1) return 'wedding-events';
    return 'planning';
  };

  const canProceedToPlanning = () => {
    if (!partyDetails.partyType) return false;
    if (partyDetails.partyType === 'wedding party') {
      return partyDetails.weddingEvents && partyDetails.weddingEvents.length > 0;
    }
    return true;
  };

  const handleNext = () => {
    if (getCurrentStepType() === 'party-type' && partyDetails.partyType) {
      if (partyDetails.partyType === 'wedding party') {
        setCurrentStep(1);
      } else {
        setCurrentStep(2);
      }
    } else if (getCurrentStepType() === 'wedding-events' && canProceedToPlanning()) {
      setCurrentStep(2);
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const events = getEventsToProcess();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-2 py-2">
        {/* Compact Header - Single Row */}
        <div className="text-center mb-2">
          <h1 className="text-xl md:text-3xl font-bold text-foreground">
            Let's Get This Party Started! 🎉
          </h1>
        </div>

        {/* Compact Sticky Header */}
        <div className="sticky top-0 z-50 bg-background border-b mb-2">
          <div className="flex justify-between items-center px-3 py-1">
            {/* Mobile Layout: Search Icon - Cart Icon - Centered Text - Checkout Button */}
            <div className="md:hidden flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <SearchIcon size="sm" variant="mobile" />
                <Button variant="outline" size="sm" className="p-1 h-8 relative">
                <ShoppingCart className="w-4 h-4" />
                {cart.length > 0 && (
                  <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center transition-transform duration-300 ${cartFlash ? 'scale-125' : 'scale-100'}`}>
                    {cart.length}
                  </span>
                )}
                </Button>
              </div>
              
              <div className="text-center flex-1 px-2">
                <p className="text-xs text-muted-foreground leading-tight">
                  Plan your perfect party
                </p>
              </div>

              <Button 
                variant="default" 
                size="sm"
                onClick={() => {
                  console.log('Mobile checkout button clicked, cart items:', cart);
                  if (cart.length > 0) {
                    localStorage.setItem('party-cart', JSON.stringify(cart));
                    navigate('/checkout');
                  }
                }}
                disabled={cart.length === 0}
                className="px-2 h-8 text-xs"
              >
                Checkout
              </Button>
            </div>

            {/* Desktop Layout: Search Icon - Cart - Centered Text - Checkout Button */}
            <div className="hidden md:flex justify-between items-center w-full">
              <div className="flex items-center gap-3">
                <SearchIcon size="md" variant="desktop" />
                <Button variant="outline" size="sm" className="relative">
                <ShoppingCart className="w-4 h-4 mr-1" />
                Cart ({cart.length})
                {cart.length > 0 && cartFlash && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center animate-ping">
                    {cart.length}
                  </span>
                )}
                </Button>
              </div>
              
              <div className="text-center flex-1 px-4">
                <p className="text-sm text-muted-foreground">
                  Plan the perfect party with our smart recommendation system
                </p>
              </div>

              <Button 
                variant="default" 
                size="sm"
                onClick={() => {
                  console.log('Desktop checkout button clicked, cart items:', cart);
                  if (cart.length > 0) {
                    localStorage.setItem('party-cart', JSON.stringify(cart));
                    navigate('/checkout');
                  }
                }}
                disabled={cart.length === 0}
              >
                Checkout
              </Button>
            </div>
          </div>
        </div>

        {getCurrentStepType() === 'party-type' && (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-4 md:p-8">
              <PartyTypeSelection 
                selectedType={partyDetails.partyType}
                onSelect={(type) => updatePartyDetails({ partyType: type })}
              />
              
              <div className="flex justify-between mt-4 md:mt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Home
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!partyDetails.partyType}
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {getCurrentStepType() === 'wedding-events' && (
          <Card className="max-w-4xl mx-auto">
            <CardContent className="p-4 md:p-8">
              <WeddingEventSelection
                selectedEvents={partyDetails.weddingEvents || []}
                onSelect={(events) => updatePartyDetails({ weddingEvents: events })}
              />
              
              <div className="flex justify-between mt-4 md:mt-8">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!canProceedToPlanning()}
                  className="flex items-center gap-2"
                >
                  Start Planning
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {getCurrentStepType() === 'planning' && (
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
            {events.map((eventName, index) => {
              const eventDetails = partyDetails.eventDetails[eventName];
              const isCompleted = completedEvents.has(eventName);
              const isMinimized = minimizedEvents.has(eventName);
              const categorySelections = partyDetails.categorySelections?.[eventName] || {};

              return (
                <div 
                  key={eventName} 
                  data-event={eventName}
                  className={`transition-all duration-500 ${isMinimized ? 'opacity-60 scale-95' : ''}`}
                >
                  {isCompleted && isMinimized ? (
                    // Minimized completed event
                    <Card className="border-green-200 bg-green-50/50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-green-800">
                              ✅ {eventName} - Completed
                            </h3>
                            <p className="text-sm text-green-600">
                              {Object.keys(categorySelections).length} categories selected
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleEventMinimized(eventName)}
                          >
                            Expand
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // Full event planning interface
                    <Card className={isCompleted ? "border-green-200" : ""}>
                      <CardContent className="p-6">
                        {isCompleted && (
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-green-600">✅</span>
                              <span className="text-sm text-green-600 font-medium">Completed</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEventMinimized(eventName)}
                            >
                              <Minimize2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                        
                        <PartyTabs
                          eventName={eventName}
                          eventDetails={eventDetails || {
                            numberOfPeople: 10,
                            drinkerType: 'medium',
                            budget: 200,
                            drinkTypes: [],
                            eventDuration: 4
                          }}
                          onUpdateEventDetails={(details) => updateEventDetails(eventName, details)}
                          onAddToCart={(eventName, category, items) => addToCart(eventName, category, items)}
                          categorySelections={categorySelections}
                          totalPartyBudget={getTotalPartyBudget()}
                          runningTotal={getRunningTotal()}
                          onComplete={() => handleEventComplete(eventName)}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}

            {/* Final completion check */}
            {events.length > 0 && events.every(event => completedEvents.has(event)) && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-8 text-center">
                  <h2 className="text-3xl font-bold text-green-800 mb-4">
                    🎉 All Events Planned!
                  </h2>
                  <p className="text-lg text-green-600 mb-6">
                    Your party planning is complete. Ready to proceed to checkout?
                  </p>
                  <div className="space-y-2 mb-6">
                    <div className="flex justify-center gap-8 text-sm">
                      <div>
                        <span className="font-medium">Total Items: </span>
                        <span>{cart.length}</span>
                      </div>
                      <div>
                        <span className="font-medium">Total Cost: </span>
                        <span className="font-bold text-green-600">${getRunningTotal().toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="font-medium">Total Budget: </span>
                        <span>${getTotalPartyBudget().toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="lg" onClick={() => {
                    console.log('Checkout button clicked, cart items:', cart);
                    console.log('Navigating to checkout with cart data');
                    // Store cart data in localStorage for checkout page
                    localStorage.setItem('party-cart', JSON.stringify(cart));
                    navigate('/checkout');
                  }}>
                    Proceed to Checkout
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Back to previous step button */}
            <div className="flex justify-start">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to {partyDetails.partyType === 'wedding party' ? 'Event Selection' : 'Party Type'}
              </Button>
            </div>
          </div>
        )}
        
        {/* Remove CartWidget - no cart pop-out on mobile */}
      </div>
    </div>
  );
};