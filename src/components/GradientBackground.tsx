import React, { useEffect, useRef, useState } from 'react';

const GradientBackground: React.FC = () => {
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  const mouseTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handleMouseMove = () => {
      setIsMouseMoving(true);
      
      // Clear existing timeout
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
      
      // Set mouse as not moving after 2 seconds of no movement
      mouseTimeoutRef.current = setTimeout(() => {
        setIsMouseMoving(false);
      }, 2000);
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (mouseTimeoutRef.current) {
        clearTimeout(mouseTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 animate-pulse" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-xl animate-float" 
           style={{ 
             animationDuration: isMouseMoving ? '6s' : '15s', 
             animationDelay: '0s',
             transition: 'animation-duration 0.5s ease-in-out'
           }} />
      
      <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-xl animate-float" 
           style={{ 
             animationDuration: isMouseMoving ? '8s' : '18s', 
             animationDelay: '2s',
             transition: 'animation-duration 0.5s ease-in-out'
           }} />
      
      <div className="absolute top-1/2 left-1/2 w-40 h-40 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-xl animate-pulse" 
           style={{ 
             animationDuration: isMouseMoving ? '10s' : '20s',
             transition: 'animation-duration 0.5s ease-in-out'
           }} />
      
      {/* Additional floating elements */}
      <div className="absolute top-1/6 right-1/6 w-16 h-16 bg-gradient-to-r from-emerald-500/15 to-teal-500/15 rounded-full blur-lg animate-float" 
           style={{ 
             animationDuration: isMouseMoving ? '12s' : '22s', 
             animationDelay: '1s',
             transition: 'animation-duration 0.5s ease-in-out'
           }} />
      
      <div className="absolute bottom-1/6 left-1/6 w-20 h-20 bg-gradient-to-r from-orange-500/15 to-red-500/15 rounded-full blur-lg animate-float" 
           style={{ 
             animationDuration: isMouseMoving ? '9s' : '16s', 
             animationDelay: '3s',
             transition: 'animation-duration 0.5s ease-in-out'
           }} />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.1)_1px,transparent_1px)] bg-[size:50px_50px] animate-pulse" />
      </div>
      
      {/* Floating geometric shapes */}
      <div className="absolute top-1/3 right-1/3 w-16 h-16 border border-indigo-500/30 rotate-45 animate-spin" 
           style={{ animationDuration: '20s' }} />
      
      <div className="absolute bottom-1/3 left-1/3 w-12 h-12 border border-cyan-500/30 rotate-45 animate-spin" 
           style={{ animationDuration: '15s', animationDirection: 'reverse' }} />
      
      {/* Glowing lines */}
      <div className="absolute top-0 left-1/2 w-px h-full bg-gradient-to-b from-transparent via-indigo-500/50 to-transparent animate-glow" />
      <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent animate-glow" />
      
      {/* Additional diagonal lines */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-cyan-500/20 to-transparent animate-pulse" 
             style={{ animationDuration: '8s' }} />
        <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-transparent via-purple-500/20 to-transparent animate-pulse" 
             style={{ animationDuration: '6s', animationDelay: '2s' }} />
      </div>
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(circle at center, transparent 0%, rgba(15, 23, 42, 0.5) 50%, rgba(15, 23, 42, 1) 100%)'
      }} />
    </div>
  );
};

export default GradientBackground; 