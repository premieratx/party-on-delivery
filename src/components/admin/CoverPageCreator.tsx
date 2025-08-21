import React from 'react';
import { SimpleCoverPageCreator } from './SimpleCoverPageCreator';

// Simple wrapper to maintain compatibility
interface CoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
  onBack?: () => void; // Added for compatibility
}

export const CoverPageCreator: React.FC<CoverPageCreatorProps> = ({ onBack, ...props }) => {
  return <SimpleCoverPageCreator {...props} />;
};

// Export both for compatibility
export const ImprovedCoverPageCreator = CoverPageCreator;