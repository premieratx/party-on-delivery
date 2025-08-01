import React, { useState } from 'react';
import { CheckoutFlow } from '@/components/delivery/CheckoutFlow';
import { CartItem, DeliveryInfo } from '@/components/DeliveryWidget';

const TestCheckout = () => {
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo>({
    date: null,
    timeSlot: '',
    address: '',
    instructions: ''
  });

  // Test cart items
  const testCartItems: CartItem[] = [
    {
      id: 'test-product-1',
      title: 'Premium Beer Pack',
      name: 'Premium Beer Pack',
      price: 24.99,
      quantity: 2,
      image: '',
      variant: undefined
    },
    {
      id: 'test-product-2', 
      title: 'Party Snacks Bundle',
      name: 'Party Snacks Bundle',
      price: 15.99,
      quantity: 1,
      image: '',
      variant: undefined
    }
  ];

  const totalPrice = testCartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-background">
      <CheckoutFlow
        cartItems={testCartItems}
        deliveryInfo={deliveryInfo}
        totalPrice={totalPrice}
        onBack={() => console.log('Back clicked')}
        onDeliveryInfoChange={setDeliveryInfo}
        onUpdateQuantity={(id, variant, quantity) => {
          console.log('Update quantity:', { id, variant, quantity });
        }}
      />
    </div>
  );
};

export default TestCheckout;