import React, { useState } from 'react';
import { CoverPageCreator } from '@/components/admin/CoverPageCreator';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CoverPageManager = () => {
  const [showEditor, setShowEditor] = useState(false);

  if (showEditor) {
    return <CoverPageCreator onBack={() => setShowEditor(false)} onSaved={() => setShowEditor(false)} />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Cover Page Manager</h1>
          <p className="text-muted-foreground">
            Create and manage cover pages for your delivery applications
          </p>
        </div>

        {/* Create/Edit Cover Pages */}
        <div className="bg-card border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Cover Page Creator</h2>
            <Button onClick={() => setShowEditor(true)}>
              Create/Edit Cover Pages
            </Button>
          </div>
          <p className="text-muted-foreground">
            Design beautiful cover pages with custom themes, interactive elements, and call-to-action buttons.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoverPageManager;