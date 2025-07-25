import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useReliableStorage } from "@/hooks/useReliableStorage";
import { PartyTypeSelection } from "@/components/party-planner/PartyTypeSelection";
import { WeddingEventSelection } from "@/components/party-planner/WeddingEventSelection";
import { EventDetailsForm } from "@/components/party-planner/EventDetailsForm";
import { ProductSelection } from "@/components/party-planner/ProductSelection";
import { PartyRecommendations } from "@/components/party-planner/PartyRecommendations";
import { CartWidget } from "@/components/party-planner/CartWidget";

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
  const [partyDetails, setPartyDetails, clearPartyDetails] = useReliableStorage<PartyDetails>('party-details', {
    partyType: '',
    eventDetails: {},
    categorySelections: {}
  });

  const [eventDetailIndex, setEventDetailIndex] = useState(0);
  const [currentEventForProducts, setCurrentEventForProducts] = useState('');
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [editingEventCategory, setEditingEventCategory] = useState<{event: string, category: string} | null>(null);

  // Calculate total steps based on party type and selected events
  const getTotalSteps = () => {
    if (!partyDetails.partyType) return 1;
    if (partyDetails.partyType === 'wedding party') {
      if (!partyDetails.weddingEvents) return 2;
      const eventDetailsSteps = partyDetails.weddingEvents.length;
      const productSelectionSteps = partyDetails.weddingEvents.reduce((total, event) => {
        const drinkTypes = partyDetails.eventDetails[event]?.drinkTypes || [];
        return total + drinkTypes.length;
      }, 0);
      return 2 + eventDetailsSteps + productSelectionSteps + 1; // Type + Events + Details + Product Selections + Summary
    }
    const drinkTypes = Object.values(partyDetails.eventDetails)[0]?.drinkTypes || [];
    return 2 + drinkTypes.length + 1; // Type + Details + Product Selections + Summary
  };

  const getCurrentStepType = () => {
    if (editingEventCategory) return 'product-selection';
    if (currentStep === 0) return 'party-type';
    if (partyDetails.partyType === 'wedding party') {
      if (currentStep === 1) return 'wedding-events';
      if (currentStep === getTotalSteps() - 1) return 'summary';
      const eventDetailsSteps = partyDetails.weddingEvents?.length || 0;
      if (currentStep <= 1 + eventDetailsSteps) return 'event-details';
      return 'product-selection';
    }
    if (currentStep === 1) return 'event-details';
    if (currentStep === getTotalSteps() - 1) return 'summary';
    return 'product-selection';
  };

  const getCurrentEventForDetails = () => {
    if (partyDetails.partyType === 'wedding party' && partyDetails.weddingEvents) {
      return partyDetails.weddingEvents[eventDetailIndex];
    }
    return partyDetails.partyType;
  };

  const getCurrentEventForProducts = () => {
    if (editingEventCategory) return editingEventCategory.event;
    if (partyDetails.partyType === 'wedding party' && partyDetails.weddingEvents) {
      return currentEventForProducts || partyDetails.weddingEvents[0];
    }
    return partyDetails.partyType;
  };

  const getCurrentCategory = () => {
    if (editingEventCategory) return editingEventCategory.category;
    const currentEvent = getCurrentEventForProducts();
    const drinkTypes = partyDetails.eventDetails[currentEvent]?.drinkTypes || [];
    return drinkTypes[currentCategoryIndex] || '';
  };

  const addToCart = (eventName: string, category: string, items: CartItem[]) => {
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
      return [...filtered, ...newItems];
    });

    // Update category selections
    setPartyDetails(prev => ({
      ...prev,
      categorySelections: {
        ...prev.categorySelections,
        [eventName]: {
          ...prev.categorySelections?.[eventName],
          [category]: newItems
        }
      }
    }));
  };

  const isCurrentEventValid = () => {
    const currentEvent = getCurrentEventForDetails();
    const eventDetails = partyDetails.eventDetails[currentEvent];
    return eventDetails && 
           eventDetails.numberOfPeople > 0 && 
           eventDetails.budget > 0 && 
           eventDetails.drinkTypes.length > 0 &&
           eventDetails.eventDuration > 0;
  };

  const handleNext = () => {
    if (editingEventCategory) {
      setEditingEventCategory(null);
      return;
    }

    const stepType = getCurrentStepType();
    
    if (stepType === 'event-details') {
      const currentEvent = getCurrentEventForDetails();
      if (!partyDetails.eventDetails[currentEvent]) {
        return;
      }
      
      if (partyDetails.partyType === 'wedding party' && partyDetails.weddingEvents) {
        if (eventDetailIndex < partyDetails.weddingEvents.length - 1) {
          setEventDetailIndex(prev => prev + 1);
        } else {
          // Move to product selection phase
          setCurrentEventForProducts(partyDetails.weddingEvents[0]);
          setCurrentCategoryIndex(0);
        }
      } else {
        // Single event, move to product selection
        setCurrentEventForProducts(partyDetails.partyType);
        setCurrentCategoryIndex(0);
      }
    } else if (stepType === 'product-selection') {
      const currentEvent = getCurrentEventForProducts();
      const drinkTypes = partyDetails.eventDetails[currentEvent]?.drinkTypes || [];
      
      if (currentCategoryIndex < drinkTypes.length - 1) {
        setCurrentCategoryIndex(prev => prev + 1);
      } else {
        // Move to next event or summary
        if (partyDetails.partyType === 'wedding party' && partyDetails.weddingEvents) {
          const currentEventIndex = partyDetails.weddingEvents.indexOf(currentEvent);
          if (currentEventIndex < partyDetails.weddingEvents.length - 1) {
            setCurrentEventForProducts(partyDetails.weddingEvents[currentEventIndex + 1]);
            setCurrentCategoryIndex(0);
          }
        }
      }
    }
    
    if (currentStep < getTotalSteps() - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (editingEventCategory) {
      setEditingEventCategory(null);
      return;
    }

    if (currentStep > 0) {
      const stepType = getCurrentStepType();
      
      if (stepType === 'product-selection') {
        if (currentCategoryIndex > 0) {
          setCurrentCategoryIndex(prev => prev - 1);
        } else {
          // Go back to previous event or event details
          if (partyDetails.partyType === 'wedding party' && partyDetails.weddingEvents) {
            const currentEventIndex = partyDetails.weddingEvents.indexOf(getCurrentEventForProducts());
            if (currentEventIndex > 0) {
              const prevEvent = partyDetails.weddingEvents[currentEventIndex - 1];
              const prevDrinkTypes = partyDetails.eventDetails[prevEvent]?.drinkTypes || [];
              setCurrentEventForProducts(prevEvent);
              setCurrentCategoryIndex(prevDrinkTypes.length - 1);
            } else {
              setCurrentStep(prev => prev - 1);
            }
          } else {
            setCurrentStep(prev => prev - 1);
          }
        }
      } else if (stepType === 'event-details' && partyDetails.partyType === 'wedding party') {
        if (eventDetailIndex > 0) {
          setEventDetailIndex(prev => prev - 1);
        } else {
          setCurrentStep(prev => prev - 1);
        }
      } else {
        setCurrentStep(prev => prev - 1);
      }
    } else {
      navigate('/');
    }
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

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [currentStep, partyDetails]);

  const progressPercentage = (currentStep / (getTotalSteps() - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Let's Get This Party Started! 🎉
          </h1>
          <Progress value={progressPercentage} className="w-full max-w-md mx-auto mb-4" />
          <p className="text-muted-foreground">
            Step {currentStep + 1} of {getTotalSteps()}
          </p>
        </div>

        {/* Content */}
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8">
            {getCurrentStepType() === 'party-type' && (
              <PartyTypeSelection 
                selectedType={partyDetails.partyType}
                onSelect={(type) => updatePartyDetails({ partyType: type })}
              />
            )}

            {getCurrentStepType() === 'wedding-events' && (
              <WeddingEventSelection
                selectedEvents={partyDetails.weddingEvents || []}
                onSelect={(events) => updatePartyDetails({ weddingEvents: events })}
              />
            )}

            {getCurrentStepType() === 'event-details' && (
              <EventDetailsForm
                eventName={getCurrentEventForDetails()}
                details={partyDetails.eventDetails[getCurrentEventForDetails()]}
                onUpdate={(details) => updateEventDetails(getCurrentEventForDetails(), details)}
              />
            )}

            {getCurrentStepType() === 'product-selection' && (
              <ProductSelection
                category={getCurrentCategory()}
                subcategories={(() => {
                  const currentEvent = getCurrentEventForProducts();
                  const category = getCurrentCategory();
                  if (category === 'beer') return partyDetails.eventDetails[currentEvent]?.beerTypes || [];
                  if (category === 'wine') return partyDetails.eventDetails[currentEvent]?.wineTypes || [];
                  if (category === 'liquor') return partyDetails.eventDetails[currentEvent]?.liquorTypes || [];
                  if (category === 'cocktails') return partyDetails.eventDetails[currentEvent]?.cocktailTypes || [];
                  return [];
                })()}
                recommendedQuantity={(() => {
                  const currentEvent = getCurrentEventForProducts();
                  const eventDetails = partyDetails.eventDetails[currentEvent];
                  if (!eventDetails) return 0;
                  
                  const { numberOfPeople, drinkerType, eventDuration, drinkTypes } = eventDetails;
                  const category = getCurrentCategory();
                  
                  let drinksPerPersonPerHour = 0.5;
                  if (drinkerType === 'light') drinksPerPersonPerHour = 0.5;
                  else if (drinkerType === 'medium') drinksPerPersonPerHour = 1;
                  else if (drinkerType === 'heavy') drinksPerPersonPerHour = 1.5;
                  
                  const totalDrinks = numberOfPeople * drinksPerPersonPerHour * eventDuration;
                  const categoryRatio = 1 / drinkTypes.length;
                  
                  return Math.ceil(totalDrinks * categoryRatio);
                })()}
                unitType={(() => {
                  const category = getCurrentCategory();
                  if (category === 'beer') return 'beers';
                  if (category === 'wine') return 'glasses';
                  if (category === 'liquor') return 'shots';
                  if (category === 'cocktails') return 'drinks';
                  return 'items';
                })()}
                budget={(() => {
                  const currentEvent = getCurrentEventForProducts();
                  const eventDetails = partyDetails.eventDetails[currentEvent];
                  if (!eventDetails) return 0;
                  
                  const categoryRatio = 1 / eventDetails.drinkTypes.length;
                  return eventDetails.budget * categoryRatio;
                })()}
                totalPartyBudget={(() => {
                  return Object.values(partyDetails.eventDetails).reduce((sum, details) => sum + details.budget, 0);
                })()}
                runningTotal={cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
                currentSelections={partyDetails.categorySelections?.[getCurrentEventForProducts()]?.[getCurrentCategory()] || []}
                onAddToCart={(items) => addToCart(getCurrentEventForProducts(), getCurrentCategory(), items)}
                onComplete={handleNext}
                onPrevious={handleBack}
              />
            )}

            {getCurrentStepType() === 'summary' && (
              <PartyRecommendations 
                partyDetails={partyDetails} 
                cart={cart}
                onEditCategory={(event, category) => setEditingEventCategory({event, category})}
              />
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {currentStep === 0 ? 'Back to Home' : 'Back'}
              </Button>

              {getCurrentStepType() !== 'summary' && getCurrentStepType() !== 'product-selection' && (
                <Button
                  onClick={handleNext}
                  disabled={
                    (getCurrentStepType() === 'party-type' && !partyDetails.partyType) ||
                    (getCurrentStepType() === 'wedding-events' && (!partyDetails.weddingEvents || partyDetails.weddingEvents.length === 0)) ||
                    (getCurrentStepType() === 'event-details' && !isCurrentEventValid())
                  }
                  className="flex items-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
        
        <CartWidget items={cart} />
      </div>
    </div>
  );
};