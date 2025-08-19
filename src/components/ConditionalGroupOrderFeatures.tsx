import React from 'react';
import { useAppConfig } from '@/hooks/useAppConfig';

interface ConditionalGroupOrderFeaturesProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ConditionalGroupOrderFeatures: React.FC<ConditionalGroupOrderFeaturesProps> = ({
  children,
  fallback = null
}) => {
  const { config } = useAppConfig();
  
  if (!config.groupOrderingEnabled) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};