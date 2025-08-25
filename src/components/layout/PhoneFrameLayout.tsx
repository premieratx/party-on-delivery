import React from 'react';

interface PhoneFrameLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const PhoneFrameLayout: React.FC<PhoneFrameLayoutProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    // Full screen black background that only shows on larger screens
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      {/* Phone frame container - perfect for all phone sizes */}
      <div className="relative w-[360px] h-[740px] bg-black">
        {/* Figma phone frame with enhanced styling */}
        <div 
          className={`w-full h-full rounded-[2rem] border-2 border-gray-600/50 shadow-[0_0_40px_rgba(255,255,255,0.1)] overflow-hidden relative bg-gradient-to-br from-gray-900 to-black ${className}`}
        >
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-between px-6 text-white text-xs z-50 bg-black/30 backdrop-blur-sm">
            <span className="font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-white/70 rounded-sm"></div>
              <div className="w-6 h-3 border border-white/70 rounded-sm relative">
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-white/70 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Animated border glow effect from Figma */}
          <div className="absolute inset-0 rounded-[2rem] border border-primary/20 animate-pulse"></div>

          {/* Content area - optimized for all content */}
          <div className="absolute inset-0 pt-10 pb-6 overflow-hidden">
            {children}
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-white/50 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};