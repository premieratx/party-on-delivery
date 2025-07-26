import { DeliveryWidget } from "@/components/DeliveryWidget";
import { PartyPlanningButton } from "@/components/PartyPlanningButton";
import partyOnDeliveryLogo from "@/assets/party-on-delivery-logo.png";
import patioPartyImage from "@/assets/patio-party-lake-travis.jpg";
import partyCollage1 from "@/assets/party-collage-1.jpg";
import partyCollage2 from "@/assets/party-collage-2.jpg";
import partyCollage3 from "@/assets/party-collage-3.jpg";

const Index = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Moving Collage Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${patioPartyImage})` }}
        />
        
        {/* Moving collage images */}
        <div className="absolute inset-0">
          <img 
            src={partyCollage1}
            alt=""
            className="absolute w-64 h-64 object-cover transform rotate-12 animate-[slide-diagonal_20s_linear_infinite] opacity-30"
            style={{ 
              top: '10%', 
              left: '-10%',
              animationDelay: '0s'
            }}
          />
          <img 
            src={partyCollage2}
            alt=""
            className="absolute w-48 h-48 object-cover transform -rotate-12 animate-[slide-diagonal_25s_linear_infinite] opacity-25"
            style={{ 
              top: '40%', 
              left: '-8%',
              animationDelay: '5s'
            }}
          />
          <img 
            src={partyCollage3}
            alt=""
            className="absolute w-56 h-56 object-cover transform rotate-6 animate-[slide-diagonal_30s_linear_infinite] opacity-20"
            style={{ 
              top: '70%', 
              left: '-12%',
              animationDelay: '10s'
            }}
          />
          <img 
            src={partyCollage1}
            alt=""
            className="absolute w-40 h-40 object-cover transform rotate-45 animate-[slide-diagonal_22s_linear_infinite] opacity-25"
            style={{ 
              top: '20%', 
              left: '-6%',
              animationDelay: '15s'
            }}
          />
        </div>
        
        {/* White overlay */}
        <div className="absolute inset-0 bg-white/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Mobile Layout (70% screen area) */}
        <div className="md:hidden w-full max-w-sm mx-auto flex flex-col items-center justify-center" style={{ minHeight: '70vh' }}>
          {/* Mobile Logo */}
          <div className="mb-8">
            <img 
              src={partyOnDeliveryLogo} 
              alt="Party On Delivery" 
              className="h-24 w-auto mx-auto"
            />
          </div>
          
          {/* Mobile Buttons */}
          <div className="w-full space-y-4">
            <PartyPlanningButton />
            <DeliveryWidget />
          </div>
        </div>

        {/* Desktop Layout (40% screen area, centered) */}
        <div className="hidden md:flex flex-col items-center justify-center" style={{ minHeight: '40vh' }}>
          {/* Desktop Logo */}
          <div className="mb-12">
            <img 
              src={partyOnDeliveryLogo} 
              alt="Party On Delivery" 
              className="h-32 w-auto mx-auto"
            />
          </div>
          
          {/* Desktop Buttons */}
          <div className="flex flex-col items-center space-y-6 w-full max-w-md">
            <PartyPlanningButton />
            <DeliveryWidget />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;