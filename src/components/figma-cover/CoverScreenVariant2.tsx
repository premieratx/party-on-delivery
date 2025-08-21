import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface CoverScreenVariant2Props {
  onClose?: () => void;
}

const CoverScreenVariant2: React.FC<CoverScreenVariant2Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900/95 via-zinc-800/95 to-slate-900/95 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateX: 15 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-5xl bg-gradient-to-br from-slate-50 via-zinc-50 to-slate-100 rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Platinum frame effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-300 via-zinc-200 to-slate-300 p-2 rounded-3xl">
          <div className="w-full h-full bg-gradient-to-br from-slate-50 to-zinc-100 rounded-2xl" />
        </div>
        
        {/* Content */}
        <div className="relative p-8 md:p-16 text-center">
          {/* Platinum Badge */}
          <div className="inline-block px-6 py-3 bg-gradient-to-r from-slate-600 via-zinc-500 to-slate-600 text-white font-bold rounded-full text-sm mb-8 shadow-2xl border border-slate-300">
            💎 PLATINUM ELITE EXPERIENCE 💎
          </div>
          
          {/* Logo with premium effect */}
          <div className="mb-10">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-slate-300 via-zinc-200 to-slate-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-slate-200 relative">
              <span className="text-4xl">🏆</span>
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-slate-300/30 to-zinc-300/30 animate-pulse" />
            </div>
          </div>
          
          {/* Title with platinum effect */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-700 via-zinc-600 to-slate-800 bg-clip-text text-transparent drop-shadow-2xl">
            Elite Concierge Service
          </h1>
          
          {/* Subtitle */}
          <p className="text-2xl text-slate-700 mb-10 max-w-3xl mx-auto font-medium leading-relaxed">
            Unparalleled luxury • Exclusive access • Platinum-tier experience
          </p>
          
          {/* Elite Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <motion.div 
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-slate-100 via-zinc-100 to-slate-200 border-2 border-slate-300 shadow-xl"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-bold mb-3 text-slate-800 text-lg">Instant Service</h3>
              <p className="text-slate-600">15-minute elite delivery</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-slate-100 via-zinc-100 to-slate-200 border-2 border-slate-300 shadow-xl"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="text-4xl mb-4">💎</div>
              <h3 className="font-bold mb-3 text-slate-800 text-lg">Exclusive Collection</h3>
              <p className="text-slate-600">Ultra-premium selections</p>
            </motion.div>
            <motion.div 
              whileHover={{ scale: 1.05, rotateY: 5 }}
              className="p-8 rounded-2xl bg-gradient-to-br from-slate-100 via-zinc-100 to-slate-200 border-2 border-slate-300 shadow-xl"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="text-4xl mb-4">👑</div>
              <h3 className="font-bold mb-3 text-slate-800 text-lg">Elite Concierge</h3>
              <p className="text-slate-600">Personal luxury advisor</p>
            </motion.div>
          </div>
          
          {/* Platinum Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)" }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-12 py-5 bg-gradient-to-r from-slate-700 via-zinc-600 to-slate-700 text-white font-bold rounded-2xl transition-all duration-300 shadow-2xl border border-slate-400 text-lg"
            >
              💎 Access Elite Collection
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-12 py-5 border-2 border-slate-400 bg-gradient-to-r from-slate-50 to-zinc-50 text-slate-800 font-bold rounded-2xl hover:from-slate-100 hover:to-zinc-100 transition-all duration-300 shadow-xl text-lg"
            >
              🏆 Platinum Catalog
            </motion.button>
          </div>
        </div>
        
        {/* Platinum shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200/10 to-transparent animate-shimmer pointer-events-none" />
      </motion.div>
    </div>
  );
};

export default CoverScreenVariant2;