import React from 'react';
import { ConditionalTelegramFeatures } from '@/components/ConditionalTelegramFeatures';
import TelegramBotSetup from '@/components/TelegramBotSetup';

export default function ConditionalTelegramBotSetup() {
  return (
    <ConditionalTelegramFeatures
      fallback={
        <div className="p-4 bg-muted/50 border border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Telegram Bot features are currently disabled. Enable them in the admin settings to access this functionality.
          </p>
        </div>
      }
    >
      <TelegramBotSetup />
    </ConditionalTelegramFeatures>
  );
}