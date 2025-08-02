import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import partyLogo from '@/assets/party-on-delivery-logo.png';
import austinRooftopParty from '@/assets/austin-rooftop-party.jpg';

const CoverPage = () => {
  const navigate = useNavigate();
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const fullText = "Party On Delivery - Austin's Premier Concierge & Alcohol Delivery Service";
  
  useEffect(() => {
    if (currentIndex < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + fullText[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 80);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, fullText]);

  const handleStart = () => {
    navigate('/');
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${austinRooftopParty})`
        }}
      />
      
      {/* Black Overlay */}
      <div className="absolute inset-0 bg-black/80" />
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 text-center">
        {/* Logo */}
        <div className="mb-8 md:mb-12">
          <img 
            src={partyLogo} 
            alt="Party On Delivery" 
            className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-4"
          />
        </div>
        
        {/* Animated Title */}
        <div className="mb-16 md:mb-20 max-w-5xl px-4">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight min-h-[100px] sm:min-h-[120px] md:min-h-[160px]">
            <span 
              className="bg-gradient-to-r from-sky-300 to-sky-500 bg-clip-text text-transparent drop-shadow-lg"
              style={{ 
                fontFamily: 'system-ui, -apple-system, sans-serif',
                textShadow: '0 0 20px rgba(56, 189, 248, 0.3)'
              }}
            >
              {displayedText}
              <span className="animate-pulse">|</span>
            </span>
          </h1>
        </div>
        
        {/* Start Button */}
        <div className="mt-8 px-4">
          <Button
            onClick={handleStart}
            className="px-8 sm:px-12 py-4 sm:py-6 text-xl sm:text-2xl md:text-3xl font-bold bg-green-500 hover:bg-green-600 text-white rounded-full shadow-2xl transform transition-all duration-300 hover:scale-105 min-w-[200px] sm:min-w-[250px]"
            style={{
              animation: 'greenLight 3s infinite',
              boxShadow: '0 0 40px rgba(34, 197, 94, 0.6), 0 0 80px rgba(34, 197, 94, 0.3)',
            }}
          >
            START
          </Button>
        </div>
        
        {/* Exclusive Badge */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 px-4">
          <div className="px-4 sm:px-6 py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-black font-semibold rounded-full text-xs sm:text-sm md:text-base shadow-lg">
            EXCLUSIVE MEMBERS ONLY
          </div>
        </div>
      </div>
      
      <style>
        {`
          @keyframes greenLight {
            0%, 40% {
              box-shadow: 0 0 40px rgba(34, 197, 94, 0.6), 0 0 80px rgba(34, 197, 94, 0.3);
              background-color: #22c55e;
            }
            50%, 90% {
              box-shadow: 0 0 60px rgba(34, 197, 94, 0.9), 0 0 120px rgba(34, 197, 94, 0.5);
              background-color: #16a34a;
            }
            100% {
              box-shadow: 0 0 40px rgba(34, 197, 94, 0.6), 0 0 80px rgba(34, 197, 94, 0.3);
              background-color: #22c55e;
            }
          }
        `}
      </style>
    </div>
  );
};

export default CoverPage;