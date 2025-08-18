import React, { useState } from 'react';
import { DirectProductSync } from '@/components/emergency/DirectProductSync';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Package, AlertTriangle } from 'lucide-react';

const ProductSyncTest = () => {
  const [pageKey, setPageKey] = useState(0);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Package className="h-6 w-6" />
              Product Sync Test Page
            </CardTitle>
            <CardDescription>
              This page will test and fix the product loading issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <Button 
                onClick={() => setPageKey(prev => prev + 1)}
                variant="outline"
                className="mb-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reset Page
              </Button>
            </div>
            
            <div key={pageKey}>
              <DirectProductSync />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-800">Known Issues Being Fixed:</h3>
                  <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                    <li>• React Error #310 (infinite loop) - FIXED</li>
                    <li>• Payment policy violation - FIXED</li>
                    <li>• Products not syncing - TESTING NOW</li>
                    <li>• Dialog accessibility warnings - FIXED</li>
                    <li>• Missing hero image - FIXED</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProductSyncTest;