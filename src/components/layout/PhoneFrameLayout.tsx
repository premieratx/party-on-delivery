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
    // Full screen black background
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-4">
      {/* Phone frame container */}
      <div className="relative">
        {/* Phone frame with exact styling from Figma design */}
        <div 
          className={`w-[393px] h-[852px] rounded-[2.5rem] border-8 border-gray-800 shadow-2xl overflow-hidden relative bg-black ${className}`}
        >
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-8 text-white text-sm z-50 bg-black/20">
            <span>9:41</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-2 bg-white/60 rounded-sm"></div>
              <div className="w-6 h-3 border border-white/60 rounded-sm"></div>
            </div>
          </div>

          {/* Content area - full height minus status bar and home indicator */}
          <div className="absolute inset-0 pt-12 pb-8">
            {children}
          </div>

          {/* Home indicator */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};