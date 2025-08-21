import React from 'react';
import { SimplePostCheckoutCreator } from './SimplePostCheckoutCreator';

interface PostCheckoutPageCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: any;
  onSaved?: () => void;
}

export const PostCheckoutPageCreator: React.FC<PostCheckoutPageCreatorProps> = (props) => {
  return <SimplePostCheckoutCreator {...props} />;
};

export default PostCheckoutPageCreator;