import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Direct navigation to the search page (working delivery app)
    navigate('/search', { replace: true });
  }, [navigate]);

  return null; // No loading screen
};

export default Index;