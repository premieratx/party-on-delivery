import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Immediate redirect to product search (default delivery app)
    navigate('/search', { replace: true });
  }, [navigate]);

  // This should never render since we redirect immediately
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="text-xl font-semibold text-foreground">Redirecting...</div>
      </div>
    </div>
  );
};

export default Index;