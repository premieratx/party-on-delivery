import { DeliveryWidget } from "@/components/DeliveryWidget";
import { SearchIcon } from "@/components/common/SearchIcon";
import { PartyPlanningButton } from "@/components/PartyPlanningButton";
import { useReliableStorage } from "@/hooks/useReliableStorage";
import nightclubDisco1 from "@/assets/nightclub-disco-1.jpg";
import nightclubDisco2 from "@/assets/nightclub-disco-2.jpg";
import nightclubDisco3 from "@/assets/nightclub-disco-3.jpg";

const Index = () => {
  const [partyDetails] = useReliableStorage('party-details', null);
  const hasProgress = partyDetails && (partyDetails.partyType || Object.keys(partyDetails.eventDetails || {}).length > 0);

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

      {/* Content - Just the main delivery widget */}
      <div className="relative z-10">
        {/* Search Icon - Top Left */}
        <div className="absolute top-4 left-4 z-20">
          <SearchIcon size="md" variant="mobile" />
        </div>
        <DeliveryWidget />
        {/* Show Resume Planning button if there's progress */}
        {hasProgress && <PartyPlanningButton />}
      </div>
    </div>
  );
};

export default Index;