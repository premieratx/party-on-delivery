import React from 'react';
import { CoverPageEditor } from './CoverPageEditor';

// Simple wrapper to maintain compatibility
interface CoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
  onBack?: () => void; // Added for compatibility
}

export const CoverPageCreator: React.FC<CoverPageCreatorProps> = ({ onBack, ...props }) => {
  return <CoverPageEditor {...props} />;
};

// Export both for compatibility
export const ImprovedCoverPageCreator = CoverPageCreator;