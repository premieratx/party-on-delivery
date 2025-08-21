import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CoverScreenProps {
  onClose?: () => void;
}

const CoverScreen: React.FC<CoverScreenProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      {/* Flexbox layout - following guidelines: no absolute positioning */}
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden"
          style={{ fontSize: '14px' }} // Base font size from guidelines
        >
          {/* Background gradient */}
          <div className="bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5">
            
            {/* Content using flexbox layout */}
            <div className="flex flex-col items-center text-center p-8 md:p-12 space-y-8">
              
              {/* Logo Section */}
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">🎉</span>
                </div>
              </div>
              
              {/* Typography following 14px base guidelines */}
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Party On Delivery
                </h1>
                
                <p className="text-xl text-muted-foreground">
                  Austin's exclusive concierge delivery service for your perfect celebration
                </p>
              </div>
              
              {/* Features Grid - responsive flexbox */}
              <div className="w-full max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col items-center p-4 rounded-lg bg-background/50 backdrop-blur-sm border space-y-2">
                    <div className="text-2xl">⚡</div>
                    <h3 className="font-semibold">Same Day Delivery</h3>
                    <p className="text-sm text-muted-foreground">Fast & reliable service</p>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-background/50 backdrop-blur-sm border space-y-2">
                    <div className="text-2xl">🏪</div>
                    <h3 className="font-semibold">Locally Owned</h3>
                    <p className="text-sm text-muted-foreground">Supporting Austin businesses</p>
                  </div>
                  <div className="flex flex-col items-center p-4 rounded-lg bg-background/50 backdrop-blur-sm border space-y-2">
                    <div className="text-2xl">🍸</div>
                    <h3 className="font-semibold">Premium Selection</h3>
                    <p className="text-sm text-muted-foreground">Curated for your event</p>
                  </div>
                </div>
              </div>
              
              {/* Three-tier Button System - following guidelines exactly */}
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                {/* Primary Button - Main action, bold filled with primary */}
                <button
                  onClick={onClose}
                  className="flex-1 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Start Shopping
                </button>
                {/* Secondary Button - Outlined with primary color, transparent background */}
                <button
                  onClick={onClose}
                  className="flex-1 px-8 py-4 border-2 border-primary bg-transparent text-primary font-semibold rounded-lg hover:bg-primary/10 transition-all duration-200"
                >
                  Browse Collections
                </button>
              </div>
            </div>
            
            {/* Smooth shimmer animation - purposeful UX enhancement */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CoverScreen;