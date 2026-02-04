import React, { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
}

interface ConfettiProps {
  active: boolean;
  onComplete?: () => void;
  particleCount?: number;
  duration?: number;
  origin?: { x: number; y: number };
}

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#f43f5e', '#8b5cf6', '#fbbf24', '#3b82f6', '#ec4899'];

const Confetti: React.FC<ConfettiProps> = ({
  active,
  onComplete,
  particleCount = 100,
  duration = 3000,
  origin = { x: 0.5, y: 0.5 },
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const createParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = [];
    const originX = width * origin.x;
    const originY = height * origin.y;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * Math.PI * 2);
      const velocity = Math.random() * 15 + 5;
      
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * velocity + (Math.random() - 0.5) * 10,
        vy: Math.sin(angle) * velocity - Math.random() * 10,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }
    return particles;
  }, [particleCount, origin]);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    particlesRef.current = createParticles(canvas.width, canvas.height);
    startTimeRef.current = performance.now();

    // Animation loop
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      
      if (elapsed > duration) {
        onComplete?.();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        // Update physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.3; // Gravity
        p.vx *= 0.99; // Air resistance
        p.rotation += p.rotationSpeed;
        
        // Fade out near end
        if (elapsed > duration - 500) {
          p.opacity = (duration - elapsed) / 500;
        }

        // Remove if off screen
        if (p.y > canvas.height + 50 || p.opacity <= 0) {
          return false;
        }

        // Draw particle
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        
        // Draw confetti shape (rectangle with slight curve)
        ctx.beginPath();
        ctx.roundRect(-p.size / 2, -p.size / 2, p.size, p.size, 2);
        ctx.fill();
        
        // Add shine effect
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(-p.size / 4, -p.size / 4, p.size / 2, p.size / 2, 1);
        ctx.fill();
        
        ctx.restore();

        return true;
      });

      if (particlesRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationRef.current);
    };
  }, [active, duration, onComplete, createParticles]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%' }}
    />
  );
};

export default Confetti;
