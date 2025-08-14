import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Navigate to the main delivery app instead of search
    navigate('/app/party-on-delivery', { replace: true });
  }, [navigate]);

  return <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-lg text-muted-foreground">Loading your delivery app...</div>
  </div>;
};

export default Index;