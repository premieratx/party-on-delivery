import React from 'react';
import austinBackground from '@/assets/austin-rooftop-party.jpg';

interface VideoBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* Simple static background */}
      <div className="absolute inset-0 w-full h-full">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
          style={{
            backgroundImage: `url(${austinBackground})`,
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 to-muted/60"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};