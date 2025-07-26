import { DeliveryWidget } from "@/components/DeliveryWidget";
import { PartyPlanningButton } from "@/components/PartyPlanningButton";
import { DirectSyncNow } from "@/components/DirectSyncNow";
import { SyncDataToSheets } from "@/components/SyncDataToSheets";
import { HelpSection } from "@/components/HelpSection";
import partyOnDeliveryLogo from "@/assets/party-on-delivery-logo.png";
import partySquare1 from "@/assets/party-square-1.jpg";
import partySquare2 from "@/assets/party-square-2.jpg";
import partySquare3 from "@/assets/party-square-3.jpg";
import partySquare4 from "@/assets/party-square-4.jpg";
import partySquare5 from "@/assets/party-square-5.jpg";
import cocktailSquare1 from "@/assets/cocktail-square-1.jpg";
import cocktailSquare2 from "@/assets/cocktail-square-2.jpg";
import cocktailSquare3 from "@/assets/cocktail-square-3.jpg";
import cocktailSquare4 from "@/assets/cocktail-square-4.jpg";
import cocktailSquare5 from "@/assets/cocktail-square-5.jpg";

const Index = () => {
  // Mix party and cocktail images for variety
  const allImages = [
    partySquare1, cocktailSquare1, partySquare2, cocktailSquare2, partySquare3,
    cocktailSquare3, partySquare4, cocktailSquare4, partySquare5, cocktailSquare5
  ];
  
  // Generate a large grid to ensure no empty spaces and variety
  const generateImageGrid = (gridSize: number) => {
    const gridImages = [];
    for (let i = 0; i < gridSize; i++) {
      gridImages.push(allImages[i % allImages.length]);
    }
    return gridImages;
  };

  // Create grids for different screen sizes
  const desktopGrid = generateImageGrid(49); // 7x7 for desktop
  const mobileGrid = generateImageGrid(81);  // 9x9 for mobile (smaller images, more fit)

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Moving Grid Background - Desktop */}
      <div className="hidden md:block absolute inset-0 overflow-hidden transform rotate-45 scale-150">
        <div className="grid grid-cols-7 gap-0 absolute inset-0">
          {desktopGrid.map((image, index) => {
            const col = index % 7;
            const animationClass = col % 2 === 0 ? 'animate-slide-up' : 'animate-slide-down';
            const delay = `${(col * 1.5)}s`;
            
            return (
              <div
                key={index}
                className={`w-32 h-32 bg-cover bg-center ${animationClass}`}
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

      {/* Moving Grid Background - Mobile */}
      <div className="md:hidden absolute inset-0 overflow-hidden transform rotate-45 scale-150">
        <div className="grid grid-cols-9 gap-0 absolute inset-0">
          {mobileGrid.map((image, index) => {
            const col = index % 9;
            const animationClass = col % 2 === 0 ? 'animate-slide-up' : 'animate-slide-down';
            const delay = `${(col * 1)}s`;
            
            return (
              <div
                key={index}
                className={`w-20 h-20 bg-cover bg-center ${animationClass}`}
                style={{ 
                  backgroundImage: `url(${image})`,
                  animationDelay: delay,
                  animationDuration: col % 2 === 0 ? '12s' : '15s'
                }}
              />
            );
          })}
        </div>
        
        {/* White overlay */}
        <div className="absolute inset-0 bg-white/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-start min-h-screen px-4 pt-4">
        {/* Mobile Layout (70% screen area, pushed to top) */}
        <div className="md:hidden w-full max-w-sm mx-auto flex flex-col items-center" style={{ minHeight: '70vh' }}>
          {/* Mobile Logo - 3x bigger */}
          <div className="mb-6">
            <img 
              src={partyOnDeliveryLogo} 
              alt="Party On Delivery" 
              className="h-72 w-auto mx-auto"
            />
          </div>
          
          {/* Mobile Buttons */}
          <div className="w-full space-y-4">
            <DeliveryWidget />
            <div className="pt-2">
              <DirectSyncNow />
            </div>
            <div className="pt-1">
              <SyncDataToSheets />
            </div>
            <PartyPlanningButton />
            
            {/* Help Section */}
            <HelpSection />
          </div>
        </div>

        {/* Desktop Layout (40% screen area, centered) */}
        <div className="hidden md:flex flex-col items-center justify-start pt-8" style={{ minHeight: '40vh' }}>
          {/* Desktop Logo - 3x bigger */}
          <div className="mb-8">
            <img 
              src={partyOnDeliveryLogo} 
              alt="Party On Delivery" 
              className="h-96 w-auto mx-auto"
            />
          </div>
          
          {/* Desktop Buttons */}
          <div className="flex flex-col items-center space-y-4 w-full max-w-md">
            <DeliveryWidget />
            <div className="pt-2 w-full">
              <DirectSyncNow />
            </div>
            <div className="pt-1 w-full">
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