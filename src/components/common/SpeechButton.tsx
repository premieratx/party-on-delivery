import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { AIAgentContainer } from '@/components/ai-agent/AIAgentContainer';

export const SpeechButton = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAddToCart = (product: any) => {
    // TODO: Integrate with existing cart functionality
    console.log('Adding to cart:', product);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-purple-600 hover:bg-purple-700"
        size="lg"
      >
        <Mic className="w-4 h-4 mr-2" />
        Just Say It
      </Button>

      <AIAgentContainer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onAddToCart={handleAddToCart}
      />
    </>
  );
};