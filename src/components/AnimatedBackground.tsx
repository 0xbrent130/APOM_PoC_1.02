import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

const AnimatedBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>();
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mouse interaction
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Initialize particles
    const initParticles = () => {
      const particles: Particle[] = [];
      const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
      
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 3 + 1,
          opacity: Math.random() * 0.5 + 0.2,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
      
      particlesRef.current = particles;
    };

    initParticles();

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      gradient.addColorStop(0.5, 'rgba(30, 41, 59, 0.95)');
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      particlesRef.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `${particle.color}${Math.floor(particle.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fill();

        // Draw connections
        particlesRef.current.forEach((otherParticle, otherIndex) => {
          if (index !== otherIndex) {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(otherParticle.x, otherParticle.y);
              ctx.strokeStyle = `rgba(99, 102, 241, ${0.1 * (1 - distance / 100)})`;
              ctx.lineWidth = 1;
              ctx.stroke();
            }
          }
        });

        // Mouse interaction effect
        const mouseDistance = Math.sqrt(
          Math.pow(particle.x - mouseRef.current.x, 2) + 
          Math.pow(particle.y - mouseRef.current.y, 2)
        );
        
        if (mouseDistance < 150) {
          const force = (150 - mouseDistance) / 150;
          particle.vx += (particle.x - mouseRef.current.x) * force * 0.01;
          particle.vy += (particle.y - mouseRef.current.y) * force * 0.01;
          
          // Draw mouse interaction glow
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(99, 102, 241, ${0.3 * force})`;
          ctx.fill();
        }
      });

      // Add floating geometric shapes
      const time = Date.now() * 0.001;
      
      // Hexagon pattern
      for (let i = 0; i < 3; i++) {
        const x = (canvas.width / 4) * (i + 1);
        const y = canvas.height / 2 + Math.sin(time + i) * 50;
        
        ctx.beginPath();
        for (let j = 0; j < 6; j++) {
          const angle = (j * Math.PI) / 3 + time * 0.5;
          const px = x + Math.cos(angle) * 30;
          const py = y + Math.sin(angle) * 30;
          if (j === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.3 + 0.2 * Math.sin(time + i)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Pulse effect
      const pulseSize = 50 + Math.sin(time * 2) * 20;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, pulseSize, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.1 + 0.05 * Math.sin(time * 2)})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Crypto-themed floating elements
      const cryptoElements = [
        { x: canvas.width * 0.1, y: canvas.height * 0.2, size: 20, rotation: time * 0.5 },
        { x: canvas.width * 0.9, y: canvas.height * 0.8, size: 15, rotation: -time * 0.3 },
        { x: canvas.width * 0.8, y: canvas.height * 0.1, size: 25, rotation: time * 0.7 }
      ];

      cryptoElements.forEach((element, index) => {
        ctx.save();
        ctx.translate(element.x, element.y);
        ctx.rotate(element.rotation);
        
        // Draw crypto symbol (simplified)
        ctx.beginPath();
        ctx.moveTo(-element.size/2, -element.size/2);
        ctx.lineTo(element.size/2, -element.size/2);
        ctx.lineTo(element.size/2, element.size/2);
        ctx.lineTo(-element.size/2, element.size/2);
        ctx.closePath();
        ctx.strokeStyle = `rgba(139, 92, 246, ${0.4 + 0.2 * Math.sin(time + index)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
      });

      // Data stream effect
      for (let i = 0; i < 5; i++) {
        const x = (canvas.width / 6) * (i + 1);
        const y = (time * 50 + i * 100) % (canvas.height + 100) - 50;
        
        ctx.fillStyle = `rgba(16, 185, 129, ${0.3 + 0.2 * Math.sin(time + i)})`;
        ctx.fillRect(x - 1, y, 2, 20);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: 'transparent' }}
    />
  );
};

export default AnimatedBackground; 