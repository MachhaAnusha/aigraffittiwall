import { useState, useEffect, useCallback } from 'react';
import { ApprovalQueue } from '../components/admin/ApprovalQueue';
import { SessionControls } from '../components/admin/SessionControls';
import { ModerationSettings } from '../components/admin/ModerationSettings';
import { StatsBar } from '../components/admin/StatsBar';
import { ArtworkCanvas, type ArtworkPiece } from '../components/display/ArtworkCanvas';
import { useSocket } from '../hooks/useSocket';

const API_BASE = import.meta.env.VITE_SOCKET_URL ?? '';

interface PendingSubmission {
  submissionId: string;
  previewDataURL: string;
  metadata: {
    textInput?: string;
    stylePreset?: string;
    deviceId?: string;
    timestamp?: number;
  };
}

export default function Admin() {
  const [token, setToken] = useState<string | null>(
    () => sessionStorage.getItem('admin-token')
  );
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [pending, setPending] = useState<PendingSubmission[]>([]);
  const [previewArtworks, setPreviewArtworks] = useState<ArtworkPiece[]>([]);
  const [paused, setPaused] = useState(false);
  const [settings, setSettings] = useState<{
    sensitivity: 'strict' | 'moderate' | 'permissive';
    bannedWords: string[];
    autoApprove: boolean;
  }>({
    sensitivity: 'moderate',
    bannedWords: [],
    autoApprove: false,
  });
  const [stats, setStats] = useState({
    totalToday: 0,
    approved: 0,
    rejected: 0,
    displaying: 0,
  });

  const { emit, on } = useSocket('admin', token ?? undefined);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pin }),
      });
      if (!res.ok) {
        setLoginError('Invalid PIN');
        return;
      }
      const data = await res.json();
      sessionStorage.setItem('admin-token', data.token);
      setToken(data.token);
      setLoginError('');
    } catch {
      setLoginError('Connection failed');
    }
  };

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`, {
        headers: { 'X-Admin-Token': token },
      });
      if (res.ok) setStats(await res.json());
    } catch {
      /* ignore */
    }
  }, [token]);

  const fetchSettings = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        headers: { 'X-Admin-Token': token },
      });
      if (res.ok) setSettings(await res.json());
    } catch {
      /* ignore */
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchStats();
    fetchSettings();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, [token, fetchStats, fetchSettings]);

  useEffect(() => {
    if (!token) return;

    const cleanups: Array<(() => void) | void> = [];

    cleanups.push(
      on('pending_approval', (data: unknown) => {
        const d = data as PendingSubmission;
        setPending((prev) => {
          if (prev.some((p) => p.submissionId === d.submissionId)) return prev;
          return [...prev, d];
        });
      })
    );

    cleanups.push(
      on('new_artwork_ready', (data: unknown) => {
        const d = data as ArtworkPiece;
        setPreviewArtworks((prev) => [...prev, d]);
        setPending((prev) => prev.filter((p) => p.submissionId !== d.submissionId));
        fetchStats();
      })
    );

    cleanups.push(
      on('wall_cleared', () => {
        setPreviewArtworks([]);
      })
    );

    cleanups.push(
      on('submissions_paused', (data: unknown) => {
        const d = data as { paused: boolean };
        setPaused(d.paused);
      })
    );

    return () => cleanups.forEach((c) => c?.());
  }, [token, on, fetchStats]);

  const approve = (id: string) => {
    emit('admin_approve', { submissionId: id });
    setPending((prev) => prev.filter((p) => p.submissionId !== id));
  };

  const reject = (id: string) => {
    emit('admin_reject', { submissionId: id, reason: 'Rejected by admin' });
    setPending((prev) => prev.filter((p) => p.submissionId !== id));
  };

  const saveSettings = async (newSettings: typeof settings) => {
    setSettings(newSettings);
    emit('admin_update_settings', { settings: newSettings });
    if (token) {
      await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': token,
        },
        body: JSON.stringify(newSettings),
      });
    }
  };

  const exportWall = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, 1920, 1080);

    let loaded = 0;
    previewArtworks.forEach((art) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const w = art.size * 1920;
        const h = (img.height / img.width) * w;
        ctx.drawImage(img, (art.position.x / 100) * 1920, (art.position.y / 100) * 1080, w, h);
        loaded++;
        if (loaded === previewArtworks.length) {
          const link = document.createElement('a');
          link.download = `graffiti-wall-${Date.now()}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        }
      };
      img.src = art.imageUrl;
    });

    if (previewArtworks.length === 0) {
      const link = document.createElement('a');
      link.download = 'graffiti-wall-empty.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  if (!token) {
    return (
      <div className="min-h-full flex items-center justify-center bg-bg-primary p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <h1 className="font-bangers text-3xl text-accent-primary text-center mb-6">Admin PIN</h1>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Enter PIN"
            className="w-full bg-bg-tertiary border border-border rounded px-4 py-3 text-center font-mono text-xl tracking-widest min-h-[44px] mb-4"
            autoFocus
          />
          {loginError && <p className="text-danger text-sm text-center mb-2">{loginError}</p>}
          <button
            type="submit"
            className="w-full py-3 bg-accent-primary text-white rounded font-bangers text-xl min-h-[44px]"
          >
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-bg-primary p-4 md:p-6 overflow-y-auto">
      <h1 className="font-bangers text-3xl text-accent-primary mb-4">Wall Admin</h1>
      <StatsBar stats={stats} />
      <ApprovalQueue pending={pending} onApprove={approve} onReject={reject} />

      <section className="mb-6">
        <h2 className="font-bangers text-2xl text-accent-primary mb-3">Live Wall Preview</h2>
        <div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden border border-border">
          <ArtworkCanvas artworks={previewArtworks} kenBurnsActive={false} />
        </div>
      </section>

      <SessionControls
        onClear={() => emit('admin_clear', {})}
        paused={paused}
        onPauseToggle={() => emit('admin_pause', { paused: !paused })}
        onExport={exportWall}
      />

      <ModerationSettings settings={settings} onChange={saveSettings} />
    </div>
  );
}
