import { DeliveryWidget } from "@/components/DeliveryWidget";
import { PartyPlanningButton } from "@/components/PartyPlanningButton";
import { DirectSyncNow } from "@/components/DirectSyncNow";
import { SyncDataToSheets } from "@/components/SyncDataToSheets";
import partyOnDeliveryLogo from "@/assets/party-on-delivery-logo.png";
import partyGrid1 from "@/assets/party-grid-1.jpg";
import partyGrid2 from "@/assets/party-grid-2.jpg";
import partyGrid3 from "@/assets/party-grid-3.jpg";
import partyGrid4 from "@/assets/party-grid-4.jpg";
import partyGrid5 from "@/assets/party-grid-5.jpg";

const Index = () => {
  // Create grid of party images - repeating pattern for seamless scrolling
  const partyImages = [partyGrid1, partyGrid2, partyGrid3, partyGrid4, partyGrid5];
  
  // Generate a grid of 25 images for desktop (5x5) with repeating pattern
  const generateImageGrid = () => {
    const gridImages = [];
    for (let i = 0; i < 25; i++) {
      gridImages.push(partyImages[i % partyImages.length]);
    }
    return gridImages;
  };

  const imageGrid = generateImageGrid();

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Moving Grid Background */}
      <div className="absolute inset-0 overflow-hidden transform rotate-45 scale-150">
        <div className="grid grid-cols-5 md:grid-cols-5 gap-0 absolute inset-0">
          {imageGrid.map((image, index) => {
            const col = index % 5;
            const animationClass = col % 2 === 0 ? 'animate-slide-up' : 'animate-slide-down';
            const delay = `${(col * 2)}s`;
            
            return (
              <div
                key={index}
                className={`w-full h-screen bg-cover bg-center ${animationClass}`}
                style={{ 
                  backgroundImage: `url(${image})`,
                  animationDelay: delay,
                  animationDuration: col % 2 === 0 ? '15s' : '18s'
                }}
              />
            );
          })}
        </div>
        
        {/* White overlay */}
        <div className="absolute inset-0 bg-white/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-start min-h-screen px-4 pt-8">
        {/* Mobile Layout (70% screen area, pushed to top) */}
        <div className="md:hidden w-full max-w-sm mx-auto flex flex-col items-center" style={{ minHeight: '70vh' }}>
          {/* Mobile Logo - 3x bigger */}
          <div className="mb-8">
            <img 
              src={partyOnDeliveryLogo} 
              alt="Party On Delivery" 
              className="h-72 w-auto mx-auto"
            />
          </div>
          
          {/* Mobile Buttons */}
          <div className="w-full space-y-4">
            <DeliveryWidget />
            <PartyPlanningButton />
            <div className="pt-4">
              <DirectSyncNow />
            </div>
            <div className="pt-2">
              <SyncDataToSheets />
            </div>
          </div>
        </div>

        {/* Desktop Layout (40% screen area, centered) */}
        <div className="hidden md:flex flex-col items-center justify-start pt-16" style={{ minHeight: '40vh' }}>
          {/* Desktop Logo - 3x bigger */}
          <div className="mb-12">
            <img 
              src={partyOnDeliveryLogo} 
              alt="Party On Delivery" 
              className="h-96 w-auto mx-auto"
            />
          </div>
          
          {/* Desktop Buttons */}
          <div className="flex flex-col items-center space-y-6 w-full max-w-md">
            <DeliveryWidget />
            <PartyPlanningButton />
            <div className="pt-4 w-full">
              <DirectSyncNow />
            </div>
            <div className="pt-2 w-full">
              <SyncDataToSheets />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;