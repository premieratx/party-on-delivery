import { useMemo } from 'react';

export function useDeliveryFee(subtotal: number) {
  const deliveryFee = useMemo(() => {
    // Simple rule: $20 for orders under $200, 10% for orders $200+
    const fee = subtotal >= 200 ? subtotal * 0.1 : 20;
    console.log('Delivery fee calculated:', { subtotal, fee });
    return fee;
  }, [subtotal]);

  return deliveryFee;
}