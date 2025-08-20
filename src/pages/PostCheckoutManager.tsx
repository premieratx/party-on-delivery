import React from 'react';
import { EnhancedPostCheckoutManager } from '@/components/admin/EnhancedPostCheckoutManager';

const PostCheckoutManager = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <EnhancedPostCheckoutManager />
      </div>
    </div>
  );
};

export default PostCheckoutManager;