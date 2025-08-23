import React from 'react';

// Simple wrapper - functionality removed for clean cover page implementation
interface CoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
  onBack?: () => void; // Added for compatibility
}

export const CoverPageCreator: React.FC<CoverPageCreatorProps> = ({ onOpenChange }) => {
  return <div>Cover Page Creator - Standalone implementation only</div>;
};