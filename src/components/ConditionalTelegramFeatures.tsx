import React from 'react';
import { useAppConfig } from '@/hooks/useAppConfig';

interface ConditionalTelegramFeaturesProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ConditionalTelegramFeatures: React.FC<ConditionalTelegramFeaturesProps> = ({
  children,
  fallback = null
}) => {
  const { config } = useAppConfig();
  
  if (!config.telegramBotEnabled) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};