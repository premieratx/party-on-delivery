import React, { useEffect, useRef } from 'react';

interface ConfettiAnimationProps {
  isActive: boolean;
  onComplete?: () => void;
  duration?: number;
}

interface Confetti {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  size: number;
  opacity: number;
  shape: 'circle' | 'square' | 'triangle';
}

export const ConfettiAnimation: React.FC<ConfettiAnimationProps> = ({
  isActive,
  onComplete,
  duration = 2000
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const confettiRef = useRef<Confetti[]>([]);
  const startTimeRef = useRef<number>();

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
  ];

  const createConfetti = (): Confetti => {
    const canvas = canvasRef.current;
    if (!canvas) throw new Error('Canvas not available');

    return {
      x: Math.random() * canvas.width,
      y: -10,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      opacity: 1,
      shape: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)] as 'circle' | 'square' | 'triangle'
    };
  };

  const drawConfetti = (ctx: CanvasRenderingContext2D, confetti: Confetti) => {
    ctx.save();
    ctx.globalAlpha = confetti.opacity;
    ctx.fillStyle = confetti.color;
    ctx.translate(confetti.x, confetti.y);
    ctx.rotate((confetti.rotation * Math.PI) / 180);

    switch (confetti.shape) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, confetti.size / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
      
      case 'square':
        ctx.fillRect(-confetti.size / 2, -confetti.size / 2, confetti.size, confetti.size);
        break;
      
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -confetti.size / 2);
        ctx.lineTo(-confetti.size / 2, confetti.size / 2);
        ctx.lineTo(confetti.size / 2, confetti.size / 2);
        ctx.closePath();
        ctx.fill();
        break;
    }

    ctx.restore();
  };

  const updateConfetti = (confetti: Confetti, deltaTime: number, canvas: HTMLCanvasElement) => {
    confetti.x += confetti.vx;
    confetti.y += confetti.vy;
    confetti.vy += 0.1; // gravity
    confetti.rotation += confetti.rotationSpeed;
    
    // Fade out over time
    confetti.opacity -= deltaTime / duration;
    
    // Remove confetti that's off screen or faded
    return confetti.y < canvas.height + 50 && confetti.opacity > 0;
  };

  const animate = (currentTime: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !startTimeRef.current) return;

    const elapsed = currentTime - startTimeRef.current;
    const progress = elapsed / duration;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Add new confetti (more at the beginning, less over time)
    const spawnRate = Math.max(0, 1 - progress) * 5;
    for (let i = 0; i < spawnRate; i++) {
      if (Math.random() < 0.3) {
        confettiRef.current.push(createConfetti());
      }
    }

    // Update and draw confetti
    confettiRef.current = confettiRef.current.filter(confetti => {
      const stillVisible = updateConfetti(confetti, 16, canvas); // Assume 60fps
      if (stillVisible) {
        drawConfetti(ctx, confetti);
      }
      return stillVisible;
    });

    // Continue animation if within duration and has confetti
    if (elapsed < duration || confettiRef.current.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Animation complete
      confettiRef.current = [];
      onComplete?.();
    }
  };

  const startConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initial burst of confetti
    confettiRef.current = [];
    for (let i = 0; i < 50; i++) {
      confettiRef.current.push(createConfetti());
    }

    startTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);
  };

  const stopConfetti = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    confettiRef.current = [];
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  useEffect(() => {
    if (isActive) {
      startConfetti();
    } else {
      stopConfetti();
    }

    return () => {
      stopConfetti();
    };
  }, [isActive]);

  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[9999] pointer-events-none"
      style={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0
      }}
    />
  );
};

// Hook for easy confetti triggering
export const useConfetti = () => {
  const [isActive, setIsActive] = React.useState(false);

  const trigger = React.useCallback(() => {
    setIsActive(true);
  }, []);

  const stop = React.useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    trigger,
    stop,
    ConfettiComponent: ({ onComplete }: { onComplete?: () => void }) => (
      <ConfettiAnimation
        isActive={isActive}
        onComplete={() => {
          setIsActive(false);
          onComplete?.();
        }}
      />
    )
  };
};