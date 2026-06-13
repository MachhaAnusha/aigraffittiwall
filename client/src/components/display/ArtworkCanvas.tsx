import { useState, useEffect, useRef } from 'react';
import { ParticleEffect } from './ParticleEffect';

export interface ArtworkPiece {
  submissionId: string;
  imageUrl: string;
  position: { x: number; y: number };
  size: number;
}

interface Props {
  artworks: ArtworkPiece[];
  kenBurnsActive: boolean;
}

export function ArtworkCanvas({ artworks, kenBurnsActive }: Props) {
  const [particles, setParticles] = useState<{ id: string; x: number; y: number } | null>(null);
  const prevCount = useRef(0);

  useEffect(() => {
    if (artworks.length > prevCount.current && artworks.length > 0) {
      const latest = artworks[artworks.length - 1];
      setParticles({
        id: latest.submissionId,
        x: latest.position.x + latest.size * 10,
        y: latest.position.y + latest.size * 10,
      });
      const t = setTimeout(() => setParticles(null), 1500);
      prevCount.current = artworks.length;
      return () => clearTimeout(t);
    }
    prevCount.current = artworks.length;
  }, [artworks]);

  return (
    <div
      className={`absolute inset-0 ${kenBurnsActive ? 'ken-burns' : ''}`}
      style={{ transformOrigin: 'center center' }}
    >
      {artworks.map((art) => (
        <img
          key={art.submissionId}
          src={art.imageUrl}
          alt=""
          className="artwork-piece fade-in-art object-contain drop-shadow-2xl"
          style={{
            left: `${art.position.x}%`,
            top: `${art.position.y}%`,
            width: `${art.size * 100}%`,
            maxWidth: '45vw',
          }}
          draggable={false}
        />
      ))}
      {particles && (
        <ParticleEffect x={particles.x} y={particles.y} active />
      )}
    </div>
  );
}
