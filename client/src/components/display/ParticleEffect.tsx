import { useEffect, useState } from 'react';

interface Props {
  x: number;
  y: number;
  active: boolean;
}

interface Particle {
  id: number;
  dx: number;
  dy: number;
  size: number;
  color: string;
}

export function ParticleEffect({ x, y, active }: Props) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!active) return;
    const colors = ['#FF2D95', '#00CFFF', '#39FF14', '#FFD700', '#7B2FFF'];
    const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      dx: (Math.random() - 0.5) * 80,
      dy: Math.random() * 60 + 20,
      size: 2 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setParticles(newParticles);
    const t = setTimeout(() => setParticles([]), 1500);
    return () => clearTimeout(t);
  }, [active, x, y]);

  if (!particles.length) return null;

  return (
    <div
      className="pointer-events-none absolute z-50"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full animate-ping"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            transform: `translate(${p.dx}px, ${p.dy}px)`,
            opacity: 0.8,
            animationDuration: '1.5s',
          }}
        />
      ))}
    </div>
  );
}
