import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Smooth redirect to working delivery app
    const timer = setTimeout(() => {
      navigate('/search', { replace: true });
    }, 10);
    return () => clearTimeout(timer);
  }, [navigate]);

  return <div></div>; // Brief render before redirect
};

export default Index;