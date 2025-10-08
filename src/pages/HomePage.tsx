import React from 'react';
import { Navigate } from 'react-router-dom';

// Homepage should show the actual app, not a cover page
export const HomePage: React.FC = () => {
  return <Navigate to="/home" replace />;
};

export default HomePage;
