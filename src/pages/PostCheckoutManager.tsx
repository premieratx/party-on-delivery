import React, { useState } from 'react';
import { PostCheckoutCreator } from '@/components/admin/PostCheckoutCreator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PostCheckoutManager = () => {
  const [showEditor, setShowEditor] = useState(false);

  if (showEditor) {
    return <PostCheckoutCreator onBack={() => setShowEditor(false)} onSaved={() => setShowEditor(false)} />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Post-Checkout Manager</h1>
          <p className="text-muted-foreground">
            Design post-checkout confirmation screens for order completion
          </p>
        </div>

        {/* Create/Edit Post-Checkout Screens */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Post-Checkout Creator</h2>
            <Button onClick={() => setShowEditor(true)}>
              Create/Edit Post-Checkout Screens
            </Button>
          </div>
          <p className="text-muted-foreground">
            Create beautiful order confirmation screens with custom messaging, branding, and follow-up actions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PostCheckoutManager;