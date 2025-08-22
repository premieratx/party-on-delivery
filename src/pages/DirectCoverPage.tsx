import React from 'react';
import { useParams } from 'react-router-dom';
import { EditableCoverScreen } from '@/components/enhanced-cover/EditableCoverScreen';

export default function DirectCoverPage() {
  const { slug } = useParams<{ slug: string }>();
  
  // Hardcoded data for premier-concierge to test if rendering works
  const coverData = {
    title: "Premier Concierge",
    subtitle: "You're Set for The Weekend",
    features: [
      {
        emoji: "⭐",
        title: "Austin's Go-To Beverage Delivery",
        description: "Same Day & Scheduled Delivery Service"
      },
      {
        emoji: "🚀", 
        title: "Same-Day Cocktail Kit Delivery",
        description: "Curated, Delicious Cocktail Kits for 10-25"
      },
      {
        emoji: "💎",
        title: "Trip Planning Consultation Included!",
        description: "Help w/Planning Your Whole Weekend in Austin!"
      }
    ],
    buttons: [
      {
        text: "Direct-to-Boat Delivery",
        type: "primary" as const,
        onClick: () => window.open('/delivery', '_blank')
      },
      {
        text: "Airbnb Delivery & Concierge", 
        type: "secondary" as const,
        onClick: () => window.open('/delivery', '_blank')
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background">
      <EditableCoverScreen
        title={coverData.title}
        subtitle={coverData.subtitle}
        features={coverData.features}
        buttons={coverData.buttons}
        variant="gold"
        standalone={true}
      />
    </div>
  );
}