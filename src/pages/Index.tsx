import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Direct navigation to the default delivery app
    navigate('/app/party-on-delivery', { replace: true });
  }, [navigate]);

  return null; // No loading screen
};

export default Index;