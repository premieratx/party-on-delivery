import React from 'react';
import { useAppConfig } from '@/hooks/useAppConfig';

interface ConditionalAIFeaturesProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ConditionalAIFeatures: React.FC<ConditionalAIFeaturesProps> = ({
  children,
  fallback = null
}) => {
  const { config } = useAppConfig();
  
  if (!config.aiBotAutomationsEnabled) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};