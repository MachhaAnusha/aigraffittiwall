import { v4 as uuidv4 } from 'uuid';
import type { AISettings } from './aiGenerationService.js';

export type SubmissionStatus =
  | 'moderating'
  | 'queued'
  | 'generating'
  | 'displaying'
  | 'rejected'
  | 'pending_approval';

export interface Submission {
  id: string;
  deviceId: string;
  canvasDataURL: string;
  canvasDataURLFull?: string;
  textInput: string;
  stylePreset: string;
  aiSettings: AISettings;
  status: SubmissionStatus;
  createdAt: number;
  queuePosition?: number;
  rejectReason?: string;
  priority: boolean;
}

const MAX_QUEUE_SIZE = 20;
const APPROVAL_TIMEOUT_MS = 5 * 60 * 1000;

let queue: Submission[] = [];
let processing = false;
let stats = {
  totalToday: 0,
  approved: 0,
  rejected: 0,
  displaying: 0,
};

const approvalTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function getStats() {
  return { ...stats, displaying: queue.filter((s) => s.status === 'displaying').length };
}

export function incrementStat(key: 'totalToday' | 'approved' | 'rejected'): void {
  stats[key]++;
}

export function createSubmission(
  payload: Omit<Submission, 'id' | 'status' | 'createdAt'>
): Submission | { error: string } {
  if (queue.length >= MAX_QUEUE_SIZE) {
    return { error: 'Queue is full. Please try again later.' };
  }

  const submission: Submission = {
    ...payload,
    id: uuidv4(),
    status: 'moderating',
    createdAt: Date.now(),
  };

  queue.push(submission);
  stats.totalToday++;
  return submission;
}

export function getSubmission(id: string): Submission | undefined {
  return queue.find((s) => s.id === id);
}

export function updateSubmissionStatus(id: string, status: SubmissionStatus, reason?: string): void {
  const sub = queue.find((s) => s.id === id);
  if (!sub) return;
  sub.status = status;
  if (reason) sub.rejectReason = reason;
}

export function getPendingApprovals(): Submission[] {
  return queue.filter((s) => s.status === 'pending_approval');
}

export function removeSubmission(id: string): void {
  queue = queue.filter((s) => s.id !== id);
  const timer = approvalTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    approvalTimers.delete(id);
  }
}

export function setApprovalTimer(
  id: string,
  onTimeout: (id: string) => void
): void {
  const existing = approvalTimers.get(id);
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    approvalTimers.delete(id);
    onTimeout(id);
  }, APPROVAL_TIMEOUT_MS);

  approvalTimers.set(id, timer);
}

export function clearApprovalTimer(id: string): void {
  const timer = approvalTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    approvalTimers.delete(id);
  }
}

export function getQueuePosition(id: string): number {
  const active = queue.filter(
    (s) => !['rejected', 'displaying'].includes(s.status)
  );
  const idx = active.findIndex((s) => s.id === id);
  return idx >= 0 ? idx + 1 : 0;
}

export function getNextForGeneration(): Submission | undefined {
  return queue.find(
    (s) => s.status === 'queued' || (s.status === 'generating' && !processing)
  );
}

export function markGenerating(id: string): void {
  const sub = queue.find((s) => s.id === id);
  if (sub) sub.status = 'generating';
}

export function isProcessing(): boolean {
  return processing;
}

export function setProcessing(value: boolean): void {
  processing = value;
}

export function clearQueue(): void {
  queue = [];
  approvalTimers.forEach((t) => clearTimeout(t));
  approvalTimers.clear();
}

export function getAllSubmissions(): Submission[] {
  return [...queue];
}
