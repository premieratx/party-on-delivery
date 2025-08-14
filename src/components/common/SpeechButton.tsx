import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SpeechButtonProps {
  className?: string;
}

export const SpeechButton: React.FC<SpeechButtonProps> = ({ className }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/voice-chat');
  };

  return (
    <Button
      onClick={handleClick}
      className={`fixed top-32 left-4 z-50 w-1/3 max-w-[120px] h-16 bg-red-500 hover:bg-red-600 text-white font-bold text-sm border-2 border-red-600 shadow-lg transition-all duration-200 hover:scale-105 ${className}`}
      size="lg"
    >
      <MessageCircle className="w-6 h-6 mr-2" />
      Just Say It
    </Button>
  );
};