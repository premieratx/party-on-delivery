import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CoverScreenVariant1Props {
  onClose?: () => void;
}

const CoverScreenVariant1: React.FC<CoverScreenVariant1Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-amber-900/90 via-yellow-800/90 to-orange-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative w-full max-w-4xl bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-2xl overflow-hidden border-4 border-amber-300"
      >
        {/* Gold accent border */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 p-1 rounded-2xl">
          <div className="w-full h-full bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl" />
        </div>
        
        {/* Content */}
        <div className="relative p-8 md:p-12 text-center">
          {/* Premium Badge */}
          <div className="inline-block px-4 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 font-bold rounded-full text-sm mb-6 shadow-lg">
            ✨ GOLD TIER EXPERIENCE ✨
          </div>
          
          {/* Logo */}
          <div className="mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-amber-400 to-yellow-500 rounded-full flex items-center justify-center shadow-xl border-4 border-amber-200">
              <span className="text-3xl">🏆</span>
            </div>
          </div>
          
          {/* Title with gold effect */}
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-700 bg-clip-text text-transparent drop-shadow-lg">
            Premium Party Delivery
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl text-amber-800 mb-8 max-w-2xl mx-auto font-medium">
            Luxury concierge service • White-glove delivery • VIP treatment
          </p>
          
          {/* Premium Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-200 shadow-lg">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold mb-2 text-amber-900">Priority Delivery</h3>
              <p className="text-sm text-amber-700">Express service in 30 mins</p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-200 shadow-lg">
              <div className="text-3xl mb-3">💎</div>
              <h3 className="font-bold mb-2 text-amber-900">Premium Products</h3>
              <p className="text-sm text-amber-700">Exclusive luxury selections</p>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-amber-100 to-yellow-100 border-2 border-amber-200 shadow-lg">
              <div className="text-3xl mb-3">🏅</div>
              <h3 className="font-bold mb-2 text-amber-900">VIP Support</h3>
              <p className="text-sm text-amber-700">Dedicated concierge service</p>
            </div>
          </div>
          
          {/* Premium Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-10 py-4 bg-gradient-to-r from-amber-500 to-yellow-600 text-white font-bold rounded-xl hover:from-amber-600 hover:to-yellow-700 transition-all duration-200 shadow-xl hover:shadow-2xl border-2 border-amber-300 hover:scale-105"
            >
              🛍️ Shop Premium Collection
            </button>
            <button
              onClick={onClose}
              className="px-10 py-4 border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 font-bold rounded-xl hover:bg-gradient-to-r hover:from-amber-100 hover:to-yellow-100 transition-all duration-200 shadow-lg hover:scale-105"
            >
              👑 VIP Catalog
            </button>
          </div>
        </div>
        
        {/* Gold shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/20 to-transparent animate-shimmer pointer-events-none" />
      </motion.div>
    </div>
  );
};

export default CoverScreenVariant1;