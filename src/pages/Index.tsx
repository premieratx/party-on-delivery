import { DeliveryWidget } from "@/components/DeliveryWidget";
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

      {/* Content - Just the main delivery widget */}
      <div className="relative z-10">
        <DeliveryWidget />
      </div>
    </div>
  );
};

export default Index;