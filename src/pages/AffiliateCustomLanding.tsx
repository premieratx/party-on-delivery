import { useParams } from 'react-router-dom';
import { DeliveryWidget } from "@/components/DeliveryWidget";
import nightclubDisco1 from "@/assets/nightclub-disco-1.jpg";

// Affiliate configuration - add new affiliates here
const affiliateConfigs = {
  'default': {
    name: 'Party On Delivery',
    bgImage: nightclubDisco1,
    primaryColor: 'from-purple-600 to-pink-600',
    welcomeText: 'Let\'s Get This Party Started!',
    description: 'Premium alcohol delivery for your events'
  },
  'austin-events': {
    name: 'Austin Events Co',
    bgImage: nightclubDisco1,
    primaryColor: 'from-blue-600 to-teal-600',
    welcomeText: 'Austin\'s Premier Event Experience',
    description: 'Curated alcohol delivery for Austin\'s finest events'
  },
  'corporate-solutions': {
    name: 'Corporate Event Solutions',
    bgImage: nightclubDisco1,
    primaryColor: 'from-gray-700 to-blue-800',
    welcomeText: 'Elevate Your Corporate Events',
    description: 'Professional alcohol catering for business functions'
  },
  'wedding-specialists': {
    name: 'Wedding Specialists',
    bgImage: nightclubDisco1,
    primaryColor: 'from-rose-400 to-pink-600',
    welcomeText: 'Perfect Drinks for Perfect Moments',
    description: 'Luxury alcohol service for your special day'
  }
};

const AffiliateCustomLanding = () => {
  const { affiliateSlug } = useParams();
  const config = affiliateConfigs[affiliateSlug as keyof typeof affiliateConfigs] || affiliateConfigs.default;

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Custom Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${config.bgImage})` }}
        />
        <div className={`absolute inset-0 bg-gradient-to-br ${config.primaryColor} opacity-75`} />
        <div className="md:hidden absolute inset-0 bg-white/50" />
      </div>

      {/* Custom Header */}
      <div className="relative z-10 text-center py-8">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          {config.welcomeText}
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-2">
          {config.description}
        </p>
        <p className="text-sm text-white/80">
          Powered by {config.name}
        </p>
      </div>

      {/* Content - Delivery Widget */}
      <div className="relative z-10">
        <DeliveryWidget />
      </div>
    </div>
  );
};

export default AffiliateCustomLanding;