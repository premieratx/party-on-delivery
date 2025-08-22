import React from 'react';
import { motion, type Variants } from 'framer-motion';

// Enhanced animation configurations for cover pages
export const ANIMATION_PRESETS = {
  // Entry animations
  fadeInUp: {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: "easeOut" as const }
  },
  
  fadeInScale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.5, ease: "easeOut" as const }
  },
  
  slideInLeft: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.7, ease: "easeOut" as const }
  },
  
  slideInRight: {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.7, ease: "easeOut" as const }
  }
};

// Stagger animation for multiple elements
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Interactive animations
export const buttonHover = {
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
    transition: { duration: 0.2 }
  },
  tap: {
    scale: 0.95,
    transition: { duration: 0.1 }
  }
};

// Particle system for premium themes
export const ParticleField: React.FC<{ count?: number; color?: string }> = ({ 
  count = 20, 
  color = "rgba(245, 184, 0, 0.6)" 
}) => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: color,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.3, 0.8, 0.3],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

// Gradient animation background
export const AnimatedBackground: React.FC<{ 
  gradient: string; 
  animate?: boolean 
}> = ({ gradient, animate = true }) => {
  if (!animate) {
    return (
      <div 
        className="absolute inset-0"
        style={{ background: gradient }}
      />
    );
  }

  return (
    <motion.div
      className="absolute inset-0"
      style={{ background: gradient }}
      animate={{
        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
};

// Animated cover page wrapper
export const AnimatedCoverWrapper: React.FC<{
  children: React.ReactNode;
  preset: 'fadeInUp' | 'fadeInScale' | 'slideInLeft' | 'slideInRight';
  delay?: number;
}> = ({ children, preset, delay = 0 }) => {
  const animation = ANIMATION_PRESETS[preset];
  
  return (
    <motion.div
      initial={animation.initial}
      animate={animation.animate}
      transition={{ ...animation.transition, delay }}
    >
      {children}
    </motion.div>
  );
};

// Interactive element with multiple animation states
export const InteractiveElement: React.FC<{
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}> = ({ children, className = "", onClick }) => {
  return (
    <motion.div
      className={`cursor-pointer ${className}`}
      variants={buttonHover}
      whileHover="hover"
      whileTap="tap"
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
};