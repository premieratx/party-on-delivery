import React from 'react';
import { ConditionalAIFeatures } from '@/components/ConditionalAIFeatures';
import AITestingControl from '@/components/AITestingControl';

export default function ConditionalAITestingControl() {
  return (
    <ConditionalAIFeatures
      fallback={
        <div className="p-4 bg-muted/50 border border-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            AI Testing features are currently disabled. Enable them in the admin settings to access this functionality.
          </p>
        </div>
      }
    >
      <AITestingControl />
    </ConditionalAIFeatures>
  );
}