import { DeliveryWidget } from "@/components/DeliveryWidget";
import { PartyPlanningButton } from "@/components/PartyPlanningButton";
import { DirectSyncNow } from "@/components/DirectSyncNow";
import { SyncDataToSheets } from "@/components/SyncDataToSheets";
import { HelpSection } from "@/components/HelpSection";
import partyOnDeliveryLogo from "@/assets/party-on-delivery-logo.png";
import nightclubDisco1 from "@/assets/nightclub-disco-1.jpg";
import nightclubDisco2 from "@/assets/nightclub-disco-2.jpg";
import nightclubDisco3 from "@/assets/nightclub-disco-3.jpg";

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Video Background (using images as frames for now) */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Rotating background images to simulate video */}
        <div 
          className="absolute inset-0 bg-cover bg-center animate-pulse"
          style={{ 
            backgroundImage: `url(${nightclubDisco1})`,
            animationDuration: '6s'
          }}
        />
        <div 
          className="absolute inset-0 bg-cover bg-center animate-pulse opacity-0"
          style={{ 
            backgroundImage: `url(${nightclubDisco2})`,
            animationDuration: '6s',
            animationDelay: '2s'
          }}
        />
        <div 
          className="absolute inset-0 bg-cover bg-center animate-pulse opacity-0"
          style={{ 
            backgroundImage: `url(${nightclubDisco3})`,
            animationDuration: '6s',
            animationDelay: '4s'
          }}
        />
        
        {/* Mobile overlay only */}
        <div className="md:hidden absolute inset-0 bg-white/50" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col items-center min-h-screen px-4 pt-8">
          <div className="w-full max-w-sm mx-auto flex flex-col items-center" style={{ minHeight: '70vh' }}>
            {/* Mobile Logo */}
            <div className="mb-6">
              <img 
                src={partyOnDeliveryLogo} 
                alt="Party On Delivery" 
                className="h-72 w-auto mx-auto"
              />
            </div>
            
            {/* Mobile Buttons - No DirectSync */}
            <div className="w-full space-y-4">
              <DeliveryWidget />
              <div className="pt-1">
                <SyncDataToSheets />
              </div>
              <PartyPlanningButton />
              
              {/* Help Section */}
              <HelpSection />
            </div>
          </div>
        </div>

        {/* Desktop Layout - Moved way up, no background overlay */}
        <div className="hidden md:flex flex-col items-center pt-4">
          {/* Desktop Logo - Moved way up */}
          <div className="mb-4">
            <img 
              src={partyOnDeliveryLogo} 
              alt="Party On Delivery" 
              className="h-48 w-auto mx-auto"
            />
          </div>
          
          {/* Desktop Buttons - Compact spacing */}
          <div className="flex flex-col items-center space-y-3 w-full max-w-md">
            <DeliveryWidget />
            <div className="w-full">
              <DirectSyncNow />
            </div>
            <div className="w-full">
              <SyncDataToSheets />
            </div>
            <PartyPlanningButton />
            
            {/* Help Section */}
            <HelpSection />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;