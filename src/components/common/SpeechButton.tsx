import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate, useLocation } from 'react-router-dom';
import discoBall from '@/assets/disco-ball-realistic.png';

interface SpeechButtonProps {
  className?: string;
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({ className }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPressed, setIsPressed] = useState(false);

  // Don't show the button on the voice chat page itself
  if (location.pathname === '/voice-chat') {
    return null;
  }

  const handleClick = () => {
    navigate('/voice-chat');
  };

  return (
    <Button
      onClick={handleClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      className={`fixed top-32 left-4 z-50 w-1/3 max-w-[120px] h-16 bg-red-500 hover:bg-red-600 text-white font-bold text-xs border-2 border-red-600 shadow-lg transition-all duration-200 hover:scale-105 rounded-full p-1 ${className}`}
      size="lg"
    >
      <div className="flex flex-col items-center justify-center h-full">
        <img 
          src={discoBall} 
          alt="Disco Ball" 
          className={`w-8 h-8 mb-1 ${isPressed ? 'animate-spin' : 'animate-spin'}`}
          style={{ 
            animationDuration: isPressed ? '0.5s' : '3s',
            filter: 'brightness(1.2) drop-shadow(0 0 8px rgba(255,255,255,0.8))'
          }}
        />
        <span className="text-xs leading-tight">Just Say It</span>
      </div>
    </Button>
  );
};