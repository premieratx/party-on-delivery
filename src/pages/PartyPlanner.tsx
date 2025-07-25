import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { PartyTypeSelection } from "@/components/party-planner/PartyTypeSelection";
import { WeddingEventSelection } from "@/components/party-planner/WeddingEventSelection";
import { EventDetailsForm } from "@/components/party-planner/EventDetailsForm";
import { PartyRecommendations } from "@/components/party-planner/PartyRecommendations";

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
}

export const PartyPlanner = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [partyDetails, setPartyDetails] = useState<PartyDetails>({
    partyType: '',
    eventDetails: {}
  });

  const [eventDetailIndex, setEventDetailIndex] = useState(0);

  // Calculate total steps based on party type and selected events
  const getTotalSteps = () => {
    if (!partyDetails.partyType) return 1;
    if (partyDetails.partyType === 'wedding party') {
      if (!partyDetails.weddingEvents) return 2;
      return 2 + partyDetails.weddingEvents.length + 1; // Type + Events + Details for each + Summary
    }
    return 3; // Type + Details + Summary
  };

  const getCurrentStepType = () => {
    if (currentStep === 0) return 'party-type';
    if (partyDetails.partyType === 'wedding party') {
      if (currentStep === 1) return 'wedding-events';
      if (currentStep === getTotalSteps() - 1) return 'summary';
      return 'event-details';
    }
    if (currentStep === 1) return 'event-details';
    return 'summary';
  };

  const getCurrentEventForDetails = () => {
    if (partyDetails.partyType === 'wedding party' && partyDetails.weddingEvents) {
      return partyDetails.weddingEvents[eventDetailIndex];
    }
    return partyDetails.partyType;
  };

  const handleNext = () => {
    const stepType = getCurrentStepType();
    
    if (stepType === 'event-details') {
      const currentEvent = getCurrentEventForDetails();
      if (!partyDetails.eventDetails[currentEvent]) {
        // Don't proceed if current event details aren't filled
        return;
      }
      
      if (partyDetails.partyType === 'wedding party' && partyDetails.weddingEvents) {
        if (eventDetailIndex < partyDetails.weddingEvents.length - 1) {
          setEventDetailIndex(prev => prev + 1);
        }
      }
    }
    
    if (currentStep < getTotalSteps() - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      const stepType = getCurrentStepType();
      
      if (stepType === 'event-details' && partyDetails.partyType === 'wedding party') {
        if (eventDetailIndex > 0) {
          setEventDetailIndex(prev => prev - 1);
        }
      }
      
      setCurrentStep(prev => prev - 1);
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

            {getCurrentStepType() === 'summary' && (
              <PartyRecommendations partyDetails={partyDetails} />
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

              {getCurrentStepType() !== 'summary' && (
                <Button
                  onClick={handleNext}
                  disabled={
                    (getCurrentStepType() === 'party-type' && !partyDetails.partyType) ||
                    (getCurrentStepType() === 'wedding-events' && (!partyDetails.weddingEvents || partyDetails.weddingEvents.length === 0)) ||
                    (getCurrentStepType() === 'event-details' && !partyDetails.eventDetails[getCurrentEventForDetails()])
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
      </div>
    </div>
  );
};