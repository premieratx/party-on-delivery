import React, { useEffect, useState } from 'react';

interface TypingIntroProps {
  text: string;
  speedMs?: number; // per character
  className?: string;
}

export const TypingIntro: React.FC<TypingIntroProps> = ({
  text,
  speedMs = 40,
  className = ''
}) => {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    let i = 0;
    setDisplay('');
    const interval = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, speedMs);
    return () => clearInterval(interval);
  }, [text, speedMs]);

  return (
    <div className={`w-full text-center`}>
      <span className={`inline-block font-semibold text-foreground/95 ${className}`}>
        {display}
        <span className="ml-1 inline-block w-2 h-5 align-[-2px] bg-primary animate-[pulse_1s_ease-in-out_infinite]"></span>
      </span>
    </div>
  );
};
