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
    // Responsive full screen container - FIXED HEIGHT for consistency
    <div className="h-screen w-full bg-black overflow-hidden">
      {/* Fixed container that maintains consistent size */}
      <div className="relative w-full h-full max-w-sm mx-auto bg-black">
        {/* Fixed frame with 812px height (iPhone 12/13/14 standard) */}
        <div 
          className={`w-full h-full max-h-[812px] rounded-none md:rounded-[2rem] border-0 md:border-2 md:border-gray-600/50 md:shadow-[0_0_40px_rgba(255,255,255,0.1)] overflow-hidden relative bg-gradient-to-br from-gray-900 to-black ${className}`}
          style={{ height: '812px' }} // Fixed height for consistency
        >
          {/* Status bar - hidden on small screens to save space */}
          <div className="hidden md:flex absolute top-0 left-0 right-0 h-10 items-center justify-between px-6 text-white text-xs z-50 bg-black/30 backdrop-blur-sm">
            <span className="font-medium">9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-white/70 rounded-sm"></div>
              <div className="w-6 h-3 border border-white/70 rounded-sm relative">
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-1 bg-white/70 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Animated border glow effect - only on larger screens */}
          <div className="hidden md:block absolute inset-0 rounded-[2rem] border border-primary/20 animate-pulse"></div>

          {/* Content area - fixed height responsive */}
          <div className="relative w-full h-full md:absolute md:inset-0 md:pt-10 md:pb-6 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};