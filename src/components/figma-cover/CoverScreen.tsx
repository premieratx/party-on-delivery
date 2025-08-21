import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CoverScreenProps {
  onClose?: () => void;
}

const CoverScreen: React.FC<CoverScreenProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5" />
        
        {/* Content */}
        <div className="relative p-8 md:p-12 text-center">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">🎉</span>
            </div>
          </div>
          
          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Party On Delivery
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Austin's exclusive concierge delivery service for your perfect celebration
          </p>
          
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1">Same Day Delivery</h3>
              <p className="text-sm text-muted-foreground">Fast & reliable service</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
              <div className="text-2xl mb-2">🏪</div>
              <h3 className="font-semibold mb-1">Locally Owned</h3>
              <p className="text-sm text-muted-foreground">Supporting Austin businesses</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 backdrop-blur-sm border">
              <div className="text-2xl mb-2">🍸</div>
              <h3 className="font-semibold mb-1">Premium Selection</h3>
              <p className="text-sm text-muted-foreground">Curated for your event</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start Shopping
            </button>
            <button
              onClick={onClose}
              className="px-8 py-4 border border-border bg-background text-foreground font-semibold rounded-lg hover:bg-accent transition-all duration-200"
            >
              Browse Collections
            </button>
          </div>
        </div>
        
        {/* Shimmer overlay */}
        <div className="absolute inset-0 animate-shimmer pointer-events-none" />
      </motion.div>
    </div>
  );
};

export default CoverScreen;