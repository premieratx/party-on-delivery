import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Heart, Briefcase, Cake, GraduationCap, Home, PartyPopper, ShoppingCart, ArrowRight } from "lucide-react";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { PartyTabs } from "./PartyTabs";
import { UnifiedCart } from "@/components/common/UnifiedCart";

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  isTyping?: boolean;
  showCursor?: boolean;
  options?: any[];
}

interface ChatPartyState {
  step: number;
  partyType: string;
  drinkTypes: string[];
  numberOfPeople: number;
  budget: number;
  eventDuration: number;
  drinkerType: 'light' | 'medium' | 'heavy';
  beerTypes?: string[];
  wineTypes?: string[];
  liquorTypes?: string[];
  cocktailTypes?: string[];
}

const partyTypes = [
  { id: 'bachelor', label: 'Bachelor Party', icon: PartyPopper },
  { id: 'bachelorette', label: 'Bachelorette Party', icon: Heart },
  { id: 'wedding party', label: 'Wedding Party', icon: Heart },
  { id: 'corporate event', label: 'Corporate Event', icon: Briefcase },
  { id: 'birthday', label: 'Birthday Party', icon: Cake },
  { id: 'graduation', label: 'Graduation Party', icon: GraduationCap },
  { id: 'house party', label: 'House Party', icon: Home },
  { id: 'no reason', label: 'No Reason - Just Party!', icon: PartyPopper },
];

const drinkTypeOptions = [
  { id: 'beer', label: 'Beer', emoji: '🍺' },
  { id: 'wine', label: 'Wine', emoji: '🍷' },
  { id: 'liquor', label: 'Liquor', emoji: '🥃' },
  { id: 'cocktails', label: 'Cocktails', emoji: '🍹' }
];

const drinkSubTypes = {
  beer: ['IPA', 'Lager', 'Stout', 'Pilsner', 'Wheat Beer'],
  wine: ['Pinot Grigio', 'Chardonnay', 'Cabernet', 'Pinot Noir', 'Rosé'],
  liquor: ['Whiskey', 'Tequila', 'Gin', 'Rum', 'Vodka'],
  cocktails: ['Margarita', 'Spicy Margarita', 'Paloma', 'Cosmo', 'Rum Punch']
};

export const ChatPartyPlanner = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentTyping, setCurrentTyping] = useState<string>('');
  const [state, setState] = useState<ChatPartyState>({
    step: 0,
    partyType: '',
    drinkTypes: [],
    numberOfPeople: 10,
    budget: 200,
    eventDuration: 4,
    drinkerType: 'medium'
  });
  const [showCart, setShowCart] = useState(false);
  const [showProductSelection, setShowProductSelection] = useState(false);
  const { cartItems, cartFlash, addToCart, getTotalPrice, getTotalItems } = useUnifiedCart();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const typeMessage = (text: string, onComplete?: () => void) => {
    let index = 0;
    setCurrentTyping('');
    
    const typeInterval = setInterval(() => {
      if (index < text.length) {
        setCurrentTyping(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(typeInterval);
        setCurrentTyping('');
        
        const messageId = Math.random().toString(36).substr(2, 9);
        setMessages(prev => [...prev, {
          id: messageId,
          type: 'bot',
          content: text,
          showCursor: true
        }]);
        
        // Flash cursor twice
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === messageId ? { ...msg, showCursor: false } : msg
          ));
          onComplete?.();
        }, 1000);
      }
    }, 50);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      type: 'user',
      content
    }]);
  };

  const addOptionsMessage = (options: any[], pulseEffect = true) => {
    const messageId = Math.random().toString(36).substr(2, 9);
    setMessages(prev => [...prev, {
      id: messageId,
      type: 'bot',
      content: '',
      options
    }]);
    
    if (pulseEffect) {
      setTimeout(() => {
        const optionElements = document.querySelectorAll(`[data-message-id="${messageId}"] .option-button`);
        optionElements.forEach((el, index) => {
          setTimeout(() => {
            el.classList.add('animate-pulse');
            setTimeout(() => el.classList.remove('animate-pulse'), 500);
          }, index * 100);
        });
      }, 500);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTyping]);

  useEffect(() => {
    // Start the conversation
    const timer = setTimeout(() => {
      typeMessage("Hello! Let's Get This Party Started!", () => {
        setTimeout(() => {
          typeMessage("What are you planning?", () => {
            addOptionsMessage(partyTypes.map(type => ({
              type: 'party-type',
              data: type
            })));
          });
        }, 500);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handlePartyTypeSelect = (partyType: any) => {
    addUserMessage(partyType.label);
    setState(prev => ({ ...prev, partyType: partyType.id, step: 1 }));
    
    setTimeout(() => {
      typeMessage("Great choice! What types of drinks would you like?", () => {
        addOptionsMessage(drinkTypeOptions.map(drink => ({
          type: 'drink-type',
          data: drink
        })));
      });
    }, 1000);
  };

  const handleDrinkTypeSelect = (drinkType: any) => {
    const updatedDrinkTypes = state.drinkTypes.includes(drinkType.id)
      ? state.drinkTypes.filter(d => d !== drinkType.id)
      : [...state.drinkTypes, drinkType.id];
    
    setState(prev => ({ ...prev, drinkTypes: updatedDrinkTypes }));
    
    if (updatedDrinkTypes.length > 0) {
      addUserMessage(`Selected: ${updatedDrinkTypes.map(dt => drinkTypeOptions.find(d => d.id === dt)?.label).join(', ')}`);
      
      setTimeout(() => {
        typeMessage("Perfect! How many people are we planning for?", () => {
          setState(prev => ({ ...prev, step: 2 }));
        });
      }, 1000);
    }
  };

  const handlePeopleSelect = (people: number) => {
    addUserMessage(`${people} people`);
    setState(prev => ({ ...prev, numberOfPeople: people, step: 3 }));
    
    setTimeout(() => {
      typeMessage("What's your budget for drinks?", () => {
        setState(prev => ({ ...prev, step: 3 }));
      });
    }, 1000);
  };

  const handleBudgetSelect = (budget: number) => {
    addUserMessage(`$${budget}`);
    setState(prev => ({ ...prev, budget, step: 4 }));
    
    setTimeout(() => {
      typeMessage("How many hours will the party last?", () => {
        setState(prev => ({ ...prev, step: 4 }));
      });
    }, 1000);
  };

  const handleDurationSelect = (duration: number) => {
    addUserMessage(`${duration} hours`);
    setState(prev => ({ ...prev, eventDuration: duration, step: 5 }));
    
    setTimeout(() => {
      typeMessage("What type of drinkers will be there?", () => {
        addOptionsMessage([
          { type: 'drinker-type', data: { id: 'light', label: 'Light (1/hr)', emoji: '🥤' } },
          { type: 'drinker-type', data: { id: 'medium', label: 'Medium (2/hr)', emoji: '🍺' } },
          { type: 'drinker-type', data: { id: 'heavy', label: 'Heavy (3/hr)', emoji: '🍻' } }
        ]);
      });
    }, 1000);
  };

  const handleDrinkerTypeSelect = (drinkerType: any) => {
    addUserMessage(drinkerType.label);
    setState(prev => ({ ...prev, drinkerType: drinkerType.id, step: 6 }));
    
    setTimeout(() => {
      typeMessage("Awesome! Now let's pick some products for your party!", () => {
        setTimeout(() => {
          setShowProductSelection(true);
        }, 1000);
      });
    }, 1000);
  };

  const handleAddToCart = (eventName: string, category: string, items: any[]) => {
    // DISABLED: Party planner cart functionality removed for simplicity
    console.log('🛒 Party planner cart disabled');
    return;
  };

  const renderMessage = (message: ChatMessage) => {
    if (message.type === 'bot' && message.options) {
      return (
        <div key={message.id} data-message-id={message.id} className="flex justify-center">
          <div className="flex flex-wrap gap-3 max-w-full justify-center">
            {message.options.map((option, index) => {
              if (option.type === 'party-type') {
                const Icon = option.data.icon;
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="option-button flex items-center gap-2 h-auto p-4 rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-base font-semibold"
                    onClick={() => handlePartyTypeSelect(option.data)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{option.data.label}</span>
                  </Button>
                );
              }
              
              if (option.type === 'drink-type') {
                const isSelected = state.drinkTypes.includes(option.data.id);
                return (
                  <Button
                    key={index}
                    variant={isSelected ? "default" : "outline"}
                    className="option-button flex items-center gap-2 h-auto p-4 rounded-2xl transition-all duration-200 text-base font-semibold"
                    onClick={() => handleDrinkTypeSelect(option.data)}
                  >
                    <span className="text-2xl">{option.data.emoji}</span>
                    <span>{option.data.label}</span>
                  </Button>
                );
              }
              
              if (option.type === 'drinker-type') {
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className="option-button flex items-center gap-2 h-auto p-4 rounded-2xl hover:bg-primary hover:text-primary-foreground transition-all duration-200 text-base font-semibold"
                    onClick={() => handleDrinkerTypeSelect(option.data)}
                  >
                    <span className="text-2xl">{option.data.emoji}</span>
                    <span>{option.data.label}</span>
                  </Button>
                );
              }
            })}
            
            {message.options[0]?.type === 'drink-type' && state.drinkTypes.length > 0 && (
              <Button
                variant="default"
                className="option-button flex items-center gap-2 h-auto p-4 rounded-2xl bg-primary text-primary-foreground text-base font-semibold"
                onClick={() => {
                  addUserMessage(`Selected: ${state.drinkTypes.map(dt => drinkTypeOptions.find(d => d.id === dt)?.label).join(', ')}`);
                  setTimeout(() => {
                    typeMessage("Perfect! How many people are we planning for?", () => {
                      setState(prev => ({ ...prev, step: 2 }));
                    });
                  }, 1000);
                }}
              >
                <ArrowRight className="w-5 h-5" />
                <span>Continue</span>
              </Button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-full px-6 py-4 rounded-2xl ${
            message.type === 'user'
              ? 'bg-primary text-primary-foreground ml-auto'
              : 'bg-muted/50'
          }`}
        >
          <p className={`${message.type === 'user' ? 'text-lg' : 'text-4xl font-bold text-primary font-mono tracking-wide'}`}>
            {message.content}
            {message.showCursor && <span className="inline-block w-1 h-10 bg-primary ml-2 animate-pulse" />}
          </p>
        </div>
      </div>
    );
  };

  const renderSliderStep = () => {
    if (state.step === 2) {
      return (
        <div className="space-y-4 max-w-xl">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <Slider
                  value={[state.numberOfPeople]}
                  onValueChange={(value) => setState(prev => ({ ...prev, numberOfPeople: value[0] }))}
                  max={200}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1</span>
                  <Badge variant="secondary">{state.numberOfPeople} people</Badge>
                  <span>200</span>
                </div>
                <Button 
                  onClick={() => handlePeopleSelect(state.numberOfPeople)}
                  className="w-full"
                >
                  Sounds Good!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (state.step === 3) {
      const maxBudget = state.numberOfPeople * 30;
      return (
        <div className="space-y-4 max-w-xl">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <Slider
                  value={[state.budget]}
                  onValueChange={(value) => setState(prev => ({ ...prev, budget: value[0] }))}
                  max={maxBudget}
                  min={50}
                  step={25}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>$50</span>
                  <Badge variant="secondary">${state.budget}</Badge>
                  <span>${maxBudget}</span>
                </div>
                <Button 
                  onClick={() => handleBudgetSelect(state.budget)}
                  className="w-full"
                >
                  Perfect!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (state.step === 4) {
      return (
        <div className="space-y-4 max-w-xl">
          <Card>
            <CardContent className="p-4">
              <div className="space-y-4">
                <Slider
                  value={[state.eventDuration]}
                  onValueChange={(value) => setState(prev => ({ ...prev, eventDuration: value[0] }))}
                  max={12}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>1hr</span>
                  <Badge variant="secondary">{state.eventDuration} hours</Badge>
                  <span>12hrs</span>
                </div>
                <Button 
                  onClick={() => handleDurationSelect(state.eventDuration)}
                  className="w-full"
                >
                  Got it!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Main Chat Window */}
      <div className="w-3/4 h-[66vh] border-4 border-primary rounded-3xl bg-background shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/20">
          <h1 className="text-2xl font-bold text-primary">Party Planner Chat</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCart(true)}
            className="relative rounded-full"
          >
            <ShoppingCart className="w-4 h-4" />
            {getTotalItems() > 0 && (
              <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
                {getTotalItems()}
              </Badge>
            )}
          </Button>
        </div>

        {/* Chat Messages - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map(renderMessage)}
          
          {/* Current typing with giant letters */}
          {currentTyping && (
            <div className="flex justify-start">
              <div className="max-w-full px-6 py-4 rounded-2xl bg-muted/50">
                <p className="text-4xl font-bold text-primary font-mono tracking-wide">
                  {currentTyping}
                  <span className="inline-block w-1 h-10 bg-primary ml-2 animate-pulse" />
                </p>
              </div>
            </div>
          )}
          
          {/* Slider steps */}
          {renderSliderStep()}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Product Selection */}
      {showProductSelection && (
        <div className="container max-w-6xl mx-auto p-4">
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">Let's add some products to your cart!</h3>
              <PartyTabs
                eventName={state.partyType}
                eventDetails={{
                  numberOfPeople: state.numberOfPeople,
                  drinkerType: state.drinkerType,
                  budget: state.budget,
                  drinkTypes: state.drinkTypes,
                  eventDuration: state.eventDuration,
                  beerTypes: state.beerTypes,
                  wineTypes: state.wineTypes,
                  liquorTypes: state.liquorTypes,
                  cocktailTypes: state.cocktailTypes
                }}
                onUpdateEventDetails={(details) => setState(prev => ({ ...prev, ...details }))}
                onAddToCart={handleAddToCart}
                categorySelections={{}}
                totalPartyBudget={state.budget}
                runningTotal={getTotalPrice()}
                onComplete={() => {}}
              />
            </CardContent>
          </Card>
          
          {/* Cart Summary */}
          {cartItems.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">Your Party Cart</h3>
                <div className="space-y-4">
                  {Object.entries(
                    cartItems.reduce((acc, item) => {
                      const category = item.category || 'Other';
                      if (!acc[category]) acc[category] = [];
                      acc[category].push(item);
                      return acc;
                    }, {} as Record<string, typeof cartItems>)
                  ).map(([category, items]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-lg capitalize">{category}</h4>
                      <div className="grid gap-2">
                        {items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-3">
                              {item.image && (
                                <img src={item.image} alt={item.title} className="w-12 h-12 object-cover rounded" />
                              )}
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <Badge variant="secondary">${(item.price * item.quantity).toFixed(2)}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center text-lg font-semibold">
                      <span>Total:</span>
                      <span>${getTotalPrice().toFixed(2)}</span>
                    </div>
                    <Button className="w-full mt-4" size="lg">
                      Proceed to Checkout
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Cart Sidebar */}
      <UnifiedCart isOpen={showCart} onClose={() => setShowCart(false)} />
    </div>
  );
};