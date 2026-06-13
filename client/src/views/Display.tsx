import { useState, useEffect, useCallback, useRef } from 'react';
import { ArtworkCanvas, type ArtworkPiece } from '../components/display/ArtworkCanvas';
import { QRCorner } from '../components/display/QRCorner';
import { ParticipantCount } from '../components/display/ParticipantCount';
import { useSocket } from '../hooks/useSocket';

export default function Display() {
  const { on } = useSocket('display');
  const [artworks, setArtworks] = useState<ArtworkPiece[]>([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [kenBurnsActive, setKenBurnsActive] = useState(false);
  const [showFullscreenPrompt, setShowFullscreenPrompt] = useState(false);
  const lastSubmissionRef = useRef(Date.now());

  useEffect(() => {
    if (!document.fullscreenElement) {
      setShowFullscreenPrompt(true);
    }
  }, []);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
      setShowFullscreenPrompt(false);
    } catch {
      setShowFullscreenPrompt(false);
    }
  }, []);

  useEffect(() => {
    const cleanups: Array<(() => void) | void> = [];

    cleanups.push(
      on('new_artwork_ready', (data: unknown) => {
        const d = data as ArtworkPiece;
        setArtworks((prev) => {
          if (prev.some((a) => a.submissionId === d.submissionId)) return prev;
          return [d]; // Show only the latest artwork, not accumulate history
        });
        lastSubmissionRef.current = Date.now();
        setKenBurnsActive(false);
      })
    );

    cleanups.push(
      on('participant_count', (data: unknown) => {
        const d = data as { count: number };
        setParticipantCount(d.count);
      })
    );

    cleanups.push(
      on('wall_cleared', () => {
        setArtworks([]);
        setKenBurnsActive(false);
      })
    );

    return () => cleanups.forEach((c) => c?.());
  }, [on]);

  useEffect(() => {
    const interval = setInterval(() => {
      const idle = Date.now() - lastSubmissionRef.current;
      if (idle > 30000 && artworks.length > 0) {
        setKenBurnsActive(true);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [artworks.length]);

  return (
    <div className="display-screen fixed inset-0 bg-black brick-texture">
      <div
        className="absolute inset-0 brick-texture pointer-events-none"
        style={{ opacity: 0.08 }}
      />
      <ArtworkCanvas artworks={artworks} kenBurnsActive={kenBurnsActive} />
      <QRCorner />
      <ParticipantCount count={participantCount} />

      {showFullscreenPrompt && (
        <button
          type="button"
          onClick={enterFullscreen}
          className="fixed inset-0 z-50 bg-black/80 text-white font-bangers text-2xl flex items-center justify-center cursor-pointer"
          style={{ cursor: 'pointer' }}
        >
          Go Fullscreen
        </button>
      )}
    </div>
  );
}
