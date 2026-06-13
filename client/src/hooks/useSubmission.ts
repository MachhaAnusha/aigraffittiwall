import { useState, useCallback, useEffect } from 'react';
import type { AISettings } from '../utils/promptBuilder';

export type SubmissionStatus =
  | 'idle'
  | 'waiting'
  | 'generating'
  | 'displaying'
  | 'rejected';

export function useSubmission(
  on: (event: string, handler: (...args: unknown[]) => void) => (() => void) | void,
  emit: (event: string, data: Record<string, unknown>) => void
) {
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [rejectReason, setRejectReason] = useState<string | null>(null);
  const [cooldownMs, setCooldownMs] = useState(0);

  useEffect(() => {
    const cleanups: Array<(() => void) | void> = [];

    cleanups.push(
      on('submission_received', () => {
        setStatus('waiting');
        setRejectReason(null);
      })
    );

    cleanups.push(
      on('submission_status', (data: unknown) => {
        const d = data as { status?: string };
        if (d.status === 'generating') setStatus('generating');
        if (d.status === 'displaying') setStatus('displaying');
        if (d.status === 'moderating') setStatus('waiting');
      })
    );

    cleanups.push(
      on('submission_rejected', (data: unknown) => {
        const d = data as { reason?: string };
        setStatus('rejected');
        setRejectReason(d.reason ?? 'Rejected');
        setTimeout(() => setStatus('idle'), 5000);
      })
    );

    cleanups.push(
      on('rate_limit', (data: unknown) => {
        const d = data as { retryAfterMs?: number };
        setCooldownMs(d.retryAfterMs ?? 300000);
        setStatus('rejected');
        setRejectReason('Rate limit reached');
      })
    );

    cleanups.push(
      on('rate_limits_cleared', () => {
        setCooldownMs(0);
        setStatus('idle');
        setRejectReason(null);
      })
    );

    return () => cleanups.forEach((c) => c?.());
  }, [on]);

  useEffect(() => {
    if (cooldownMs <= 0) return;
    const interval = setInterval(() => {
      setCooldownMs((ms) => {
        const next = Math.max(0, ms - 1000);
        if (next === 0) {
          setStatus('idle');
          setRejectReason(null);
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownMs]);

  const submit = useCallback(
    (payload: {
      canvasDataURL: string;
      canvasDataURLFull?: string;
      textInput: string;
      stylePreset: string;
      aiSettings: AISettings;
      queueOnly?: boolean;
    }) => {
      if (cooldownMs > 0) return;
      setStatus('waiting');
      const event = payload.queueOnly ? 'add_to_queue' : 'submit_artwork';
      emit(event, payload);
    },
    [emit, cooldownMs]
  );

  return { status, rejectReason, cooldownMs, submit, setStatus };
}
