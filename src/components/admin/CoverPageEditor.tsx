import React from 'react';
import { UnifiedCoverPageEditor } from './UnifiedCoverPageEditor';

// Simple wrapper to maintain compatibility with original Unified Cover Page Editor
interface CoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
  onBack?: () => void; // Added for compatibility
}

export const CoverPageCreator: React.FC<CoverPageCreatorProps> = ({ onBack, ...props }) => {
  return <UnifiedCoverPageEditor {...props} />;
};

// Export both for compatibility
export const ImprovedCoverPageCreator = CoverPageCreator;
export const CoverPageEditor = CoverPageCreator; // Legacy compatibility