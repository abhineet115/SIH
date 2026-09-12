import React, { useEffect, useState } from 'react';

export function AnimatedStarfield() {
  const [stars, setStars] = useState<{ id: number, top: string, left: string, size: number, delay: number, duration: number, o: number }[]>([]);

  useEffect(() => {
    // Generate 200 random stars
    const generateStars = () => {
      const generated = Array.from({ length: 200 }).map((_, i) => ({
        id: i,
        top: `${Math.random() * 100}vh`,
        left: `${Math.random() * 100}vw`,
        size: Math.random() * 2 + 0.5,
        delay: Math.random() * 10,
        duration: Math.random() * 20 + 20,
        o: Math.random() * 0.5 + 0.3
      }));
      setStars(generated);
    };
    generateStars();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -1,
      background: 'transparent',
      overflow: 'hidden'
    }}>
      {/* Dynamic drifting stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="star-anim"
          style={{
            position: 'absolute',
            top: star.top,
            left: star.left,
            width: `${star.size}px`,
            height: `${star.size}px`,
            backgroundColor: `rgba(255, 255, 255, ${star.o})`,
            borderRadius: '50%',
            boxShadow: `0 0 ${star.size * 2}px rgba(14, 165, 233, 0.4)`,
            animation: `drift ${star.duration}s linear ${star.delay}s infinite`,
            opacity: 0 /* Faded until animation kicks in */
          }}
        />
      ))}
      {/* Heavy central blue glow */}
      <div style={{
        position: 'absolute',
        top: '-20%',
        left: '20%',
        width: '60%',
        height: '60%',
        background: 'radial-gradient(ellipse at center, rgba(14, 165, 233, 0.12) 0%, transparent 60%)',
        filter: 'blur(40px)',
        zIndex: 0
      }} />
      <div className="scanlines"></div>
    </div>
  );
}
