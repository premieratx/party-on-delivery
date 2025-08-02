import React from 'react';
import austinBackground from '@/assets/austin-party-background.jpg';

interface VideoBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Video Background Container */}
      <div className="absolute inset-0 w-full h-full">
        {/* Animated background using CSS */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 animate-pulse"></div>
        
        {/* Static background image as fallback */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{
            backgroundImage: `url(${austinBackground})`,
          }}
        ></div>
        
        {/* Animated overlay elements to simulate video */}
        <div className="absolute inset-0">
          {/* Floating elements */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/40 rounded-full animate-bounce"></div>
          <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-secondary/40 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/3 w-2 h-2 bg-accent/40 rounded-full animate-ping"></div>
          
          {/* Moving gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-slide-in-right"></div>
        </div>
        
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20"></div>
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};