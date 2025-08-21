import React from 'react';

interface PerfectScrollContainerProps {
  children: React.ReactNode;
  className?: string;
  height?: string;
}

export const PerfectScrollContainer: React.FC<PerfectScrollContainerProps> = ({ 
  children, 
  className = '',
  height = 'h-full'
}) => {
  return (
    <div 
      className={`${height} overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400 ${className}`}
      style={{
        scrollbarWidth: 'thin',
        scrollbarColor: '#d1d5db #f3f4f6'
      }}
    >
      {children}
    </div>
  );
};

// Add to global CSS for webkit browsers
export const scrollbarStyles = `
  .scrollbar-thin::-webkit-scrollbar {
    width: 6px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 3px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
  
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
  
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #d1d5db #f3f4f6;
  }
`;