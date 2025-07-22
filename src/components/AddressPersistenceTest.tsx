/**
 * Simple test component to verify address persistence
 */
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomerInfo } from '@/hooks/useCustomerInfo';

export const AddressPersistenceTest: React.FC = () => {
  const { customerInfo, setCustomerInfo, addressInfo, setAddressInfo } = useCustomerInfo();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runTest = () => {
    addTestResult('=== STARTING ADDRESS PERSISTENCE TEST ===');
    
    // Test data
    const testCustomer = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      phone: '555-1234'
    };
    
    const testAddress = {
      street: '123 Test Street',
      city: 'Test City',
      state: 'TX',
      zipCode: '12345',
      instructions: 'Test instructions'
    };

    // Save test data
    addTestResult('Saving test customer data...');
    setCustomerInfo(testCustomer);
    
    addTestResult('Saving test address data...');
    setAddressInfo(testAddress);
    
    addTestResult('Data saved. Check storage locations...');
    
    // Check all storage locations
    setTimeout(() => {
      const customer = localStorage.getItem('partyondelivery_customer');
      const address = localStorage.getItem('partyondelivery_address');
      const customerPersistent = localStorage.getItem('partyondelivery_customer_persistent');
      const addressPersistent = localStorage.getItem('partyondelivery_address_persistent');
      const lastOrder = localStorage.getItem('partyondelivery_last_order');
      
      addTestResult(`customer storage: ${customer ? 'FOUND' : 'MISSING'}`);
      addTestResult(`address storage: ${address ? 'FOUND' : 'MISSING'}`);
      addTestResult(`customer persistent: ${customerPersistent ? 'FOUND' : 'MISSING'}`);
      addTestResult(`address persistent: ${addressPersistent ? 'FOUND' : 'MISSING'}`);
      addTestResult(`last order: ${lastOrder ? 'FOUND' : 'MISSING'}`);
      
      if (customer) {
        try {
          const parsed = JSON.parse(customer);
          addTestResult(`customer data: ${parsed.firstName} ${parsed.lastName} (${parsed.email})`);
        } catch (e) {
          addTestResult(`customer data: PARSE ERROR`);
        }
      }
      
      if (address) {
        try {
          const parsed = JSON.parse(address);
          addTestResult(`address data: ${parsed.street}, ${parsed.city}, ${parsed.state}`);
        } catch (e) {
          addTestResult(`address data: PARSE ERROR`);
        }
      }
      
      addTestResult('=== TEST COMPLETE ===');
    }, 1000);
  };

  const clearAll = () => {
    localStorage.removeItem('partyondelivery_customer');
    localStorage.removeItem('partyondelivery_address');
    localStorage.removeItem('partyondelivery_customer_persistent');
    localStorage.removeItem('partyondelivery_address_persistent');
    localStorage.removeItem('partyondelivery_last_order');
    localStorage.removeItem('partyondelivery_completed_order');
    
    setCustomerInfo({ firstName: '', lastName: '', email: '', phone: '' });
    setAddressInfo({ street: '', city: '', state: '', zipCode: '', instructions: '' });
    
    setTestResults([]);
    addTestResult('All storage cleared');
  };

  const reloadPage = () => {
    window.location.reload();
  };

  useEffect(() => {
    addTestResult('Component mounted. Current data:');
    addTestResult(`Customer: ${customerInfo.firstName} ${customerInfo.lastName} (${customerInfo.email})`);
    addTestResult(`Address: ${addressInfo.street}, ${addressInfo.city}, ${addressInfo.state}`);
  }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Address Persistence Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Current Customer Info:</Label>
              <div className="text-sm text-muted-foreground">
                {customerInfo.firstName} {customerInfo.lastName}<br/>
                {customerInfo.email}<br/>
                {customerInfo.phone}
              </div>
            </div>
            <div>
              <Label>Current Address Info:</Label>
              <div className="text-sm text-muted-foreground">
                {addressInfo.street}<br/>
                {addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}<br/>
                {addressInfo.instructions}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={runTest}>Run Test</Button>
            <Button onClick={clearAll} variant="outline">Clear All</Button>
            <Button onClick={reloadPage} variant="secondary">Reload Page</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm font-mono">
            {testResults.map((result, index) => (
              <div key={index} className="text-muted-foreground">
                {result}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Manual Address Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={customerInfo.firstName}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={customerInfo.lastName}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, lastName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="street">Street</Label>
              <Input
                id="street"
                value={addressInfo.street}
                onChange={(e) => setAddressInfo(prev => ({ ...prev, street: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={addressInfo.city}
                onChange={(e) => setAddressInfo(prev => ({ ...prev, city: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={addressInfo.state}
                onChange={(e) => setAddressInfo(prev => ({ ...prev, state: e.target.value }))}
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Enter some data above, then reload the page to test persistence.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};