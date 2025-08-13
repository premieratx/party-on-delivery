import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const TestGroupOrderFlow = () => {
  const navigate = useNavigate();

  const testGroupOrderJoin = () => {
    // Simulate clicking a group order share link
    const testShareToken = '123e4567-e89b-12d3-a456-426614174000';
    navigate(`/?share=${testShareToken}`);
  };

  const createTestOrder = () => {
    // Navigate to checkout to create an order and see share link
    navigate('/?checkout=true');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Test Group Order Flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Step 1: Create an Order</h3>
            <p className="text-sm text-muted-foreground">
              Complete a checkout to see the share link on the completion screen
            </p>
            <Button onClick={createTestOrder} className="w-full">
              Start New Order & Test Share Link
            </Button>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Step 2: Test Group Order Join</h3>
            <p className="text-sm text-muted-foreground">
              Simulate clicking a shared group order link to see the join modal
            </p>
            <Button onClick={testGroupOrderJoin} variant="outline" className="w-full">
              Test Group Order Join Modal
            </Button>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold">Instructions:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>1. Click "Start New Order" and complete checkout</li>
              <li>2. Look for the share link on the order completion screen</li>
              <li>3. Copy the share link and test it in a new tab</li>
              <li>4. You should see the "Join Group Order?" modal</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestGroupOrderFlow;