import React from 'react';
import { EnhancedCoverPageCreator } from './EnhancedCoverPageCreator';

interface SimpleCoverPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

export const SimpleCoverPageCreator: React.FC<SimpleCoverPageCreatorProps> = (props) => {
  // Redirect to the enhanced version with all the new features
  return <EnhancedCoverPageCreator {...props} />;
};