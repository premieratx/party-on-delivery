import React from 'react';
import { HomeHero } from '@/routes/home/HomeHero';
import { HomeHealthCheck } from '@/routes/home/HomeHealthCheck';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <HomeHero />
      <HomeHealthCheck />
    </div>
  );
};

export default Home;