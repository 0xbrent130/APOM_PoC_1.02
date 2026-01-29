import React from 'react';
import AnimatedBackground from './AnimatedBackground';
import GradientBackground from './GradientBackground';

const Background: React.FC = () => {
  return (
    <>
      <GradientBackground />
      <AnimatedBackground />
    </>
  );
};

export default Background; 