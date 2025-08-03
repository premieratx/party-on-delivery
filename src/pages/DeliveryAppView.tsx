import React from 'react';
import { useParams } from 'react-router-dom';
import { CustomDeliveryAppWidget } from '@/components/custom-delivery/CustomDeliveryAppWidget';
import { DeliveryAppVariationWidget } from '@/components/custom-delivery/DeliveryAppVariationWidget';

export default function DeliveryAppView() {
  const { appSlug } = useParams<{ appSlug: string }>();
  
  // If no appSlug, show main delivery app
  if (!appSlug) {
    return <CustomDeliveryAppWidget />;
  }
  
  // Show variation delivery app
  return <DeliveryAppVariationWidget appSlug={appSlug} />;
}