import dotenv from 'dotenv';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });
import apiRouter from './routes/api.js';
import {
  moderateText,
  moderateImage,
  shouldAutoApprove,
  getModerationSettings,
  updateModerationSettings,
} from './services/moderationService.js';
import { generateArtworkImg2Img, getGenerationMode } from './services/aiGenerationService.js';
import {
  createSubmission,
  getSubmission,
  updateSubmissionStatus,
  setApprovalTimer,
  clearApprovalTimer,
  getQueuePosition,
  setProcessing,
  isProcessing,
  clearQueue,
  getStats,
  incrementStat,
  removeSubmission,
  getPendingApprovals,
  type Submission,
} from './services/queueService.js';
import { verifyAdminToken } from './middleware/adminAuth.js';

const PORT = parseInt(process.env.PORT ?? '3001', 10);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use('/api', apiRouter);

const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(clientDist, 'index.html'), (err) => {
    if (err) next();
  });
});

// Session state
let paused = false;
const registeredDevices = new Map<string, string>(); // socketId -> deviceId
const deviceSockets = new Map<string, Set<string>>(); // deviceId -> socketIds
const rateLimitMap = new Map<string, number[]>(); // deviceId -> timestamps
const adminSockets = new Set<string>();
const displayArtworks: Array<{
  submissionId: string;
  imageUrl: string;
  position: { x: number; y: number };
  size: number;
}> = [];

const isProduction = process.env.NODE_ENV === 'production';
const RATE_LIMIT_MAX = parseInt(
  process.env.RATE_LIMIT_MAX ?? (isProduction ? '3' : '0'),
  10
);
const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS ?? String(5 * 60 * 1000),
  10
);

function getParticipantCount(): number {
  const devices = new Set<string>();
  for (const [, deviceId] of registeredDevices) {
    devices.add(deviceId);
  }
  return devices.size;
}

function broadcastParticipantCount(): void {
  io.emit('participant_count', { count: getParticipantCount(), timestamp: Date.now() });
}

function clearRateLimits(deviceId?: string): void {
  if (deviceId) {
    rateLimitMap.delete(deviceId);
  } else {
    rateLimitMap.clear();
  }
}

function checkRateLimit(deviceId: string): { allowed: boolean; retryAfterMs?: number } {
  if (RATE_LIMIT_MAX <= 0) return { allowed: true };

  const now = Date.now();
  let timestamps = rateLimitMap.get(deviceId) ?? [];
  timestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(deviceId, timestamps);

  if (timestamps.length >= RATE_LIMIT_MAX) {
    const oldest = timestamps[0];
    return { allowed: false, retryAfterMs: RATE_LIMIT_WINDOW_MS - (now - oldest) };
  }
  return { allowed: true };
}

function recordSubmission(deviceId: string): void {
  const timestamps = rateLimitMap.get(deviceId) ?? [];
  timestamps.push(Date.now());
  rateLimitMap.set(deviceId, timestamps);
}

function registerDevice(socketId: string, deviceId: string): void {
  registeredDevices.set(socketId, deviceId);
  if (!deviceSockets.has(deviceId)) {
    deviceSockets.set(deviceId, new Set());
  }
  deviceSockets.get(deviceId)!.add(socketId);
}

function unregisterDevice(socketId: string): void {
  const deviceId = registeredDevices.get(socketId);
  registeredDevices.delete(socketId);
  if (deviceId) {
    deviceSockets.get(deviceId)?.delete(socketId);
    if (deviceSockets.get(deviceId)?.size === 0) {
      deviceSockets.delete(deviceId);
    }
  }
}

function emitToDevice(deviceId: string, event: string, data: unknown): void {
  const sockets = deviceSockets.get(deviceId);
  if (!sockets) return;
  for (const sid of sockets) {
    io.to(sid).emit(event, data);
  }
}

function randomPosition(): { x: number; y: number } {
  const existing = displayArtworks.map((a) => a.position);
  for (let attempt = 0; attempt < 50; attempt++) {
    const x = 5 + Math.random() * 55;
    const y = 5 + Math.random() * 55;
    const tooClose = existing.some(
      (p) => Math.abs(p.x - x) < 20 && Math.abs(p.y - y) < 20
    );
    if (!tooClose) return { x, y };
  }
  return { x: 10 + Math.random() * 40, y: 10 + Math.random() * 40 };
}

function randomSize(): number {
  return 0.2 + Math.random() * 0.25;
}

async function processGenerationQueue(): Promise<void> {
  if (isProcessing()) return;

  const { getAllSubmissions } = await import('./services/queueService.js');
  const pending = getAllSubmissions().find((s) => s.status === 'queued');

  if (!pending) return;

  setProcessing(true);
  updateSubmissionStatus(pending.id, 'generating');

  io.emit('submission_status', {
    submissionId: pending.id,
    status: 'generating',
    timestamp: Date.now(),
    deviceId: pending.deviceId,
  });

  try {
    const imageUrl = await generateArtworkImg2Img({
      canvasDataURL: pending.canvasDataURLFull ?? pending.canvasDataURL,
      textInput: pending.textInput,
      stylePreset: pending.stylePreset,
      aiSettings: pending.aiSettings,
      submissionId: pending.id,
    });

    const position = randomPosition();
    const size = randomSize();

    displayArtworks.push({
      submissionId: pending.id,
      imageUrl,
      position,
      size,
    });

    updateSubmissionStatus(pending.id, 'displaying');
    incrementStat('approved');

    const payload = {
      submissionId: pending.id,
      imageUrl,
      position,
      size,
      deviceId: pending.deviceId,
      timestamp: Date.now(),
    };

    io.emit('new_artwork_ready', payload);
    emitToDevice(pending.deviceId, 'submission_status', {
      submissionId: pending.id,
      status: 'displaying',
      timestamp: Date.now(),
      deviceId: pending.deviceId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Generation failed', err);
    const reason = `Generation failed: ${message}`;
    updateSubmissionStatus(pending.id, 'rejected', reason);
    incrementStat('rejected');
    emitToDevice(pending.deviceId, 'submission_rejected', {
      submissionId: pending.id,
      reason,
      timestamp: Date.now(),
      deviceId: pending.deviceId,
    });
  } finally {
    setProcessing(false);
    processGenerationQueue();
  }
}

async function runModerationAndQueue(
  submission: Submission,
  socket: import('socket.io').Socket
): Promise<void> {
  if (submission.textInput) {
    const textResult = await moderateText(submission.textInput);
    if (!textResult.pass) {
      updateSubmissionStatus(submission.id, 'rejected', textResult.reason);
      incrementStat('rejected');
      emitToDevice(submission.deviceId, 'submission_rejected', {
        submissionId: submission.id,
        reason: textResult.reason,
        timestamp: Date.now(),
        deviceId: submission.deviceId,
      });
      removeSubmission(submission.id);
      return;
    }
  }

  const imageResult = await moderateImage(submission.canvasDataURL);
  if (!imageResult.pass) {
    updateSubmissionStatus(submission.id, 'rejected', imageResult.reason);
    incrementStat('rejected');
    emitToDevice(submission.deviceId, 'submission_rejected', {
      submissionId: submission.id,
      reason: imageResult.reason,
      timestamp: Date.now(),
      deviceId: submission.deviceId,
    });
    removeSubmission(submission.id);
    return;
  }

  if (shouldAutoApprove()) {
    updateSubmissionStatus(submission.id, 'queued');
    emitToDevice(submission.deviceId, 'submission_status', {
      submissionId: submission.id,
      status: 'generating',
      timestamp: Date.now(),
      deviceId: submission.deviceId,
    });
    processGenerationQueue();
    return;
  }

  updateSubmissionStatus(submission.id, 'pending_approval');

  for (const adminId of adminSockets) {
    io.to(adminId).emit('pending_approval', {
      submissionId: submission.id,
      previewDataURL: submission.canvasDataURL,
      metadata: {
        textInput: submission.textInput,
        stylePreset: submission.stylePreset,
        deviceId: submission.deviceId,
        timestamp: submission.createdAt,
      },
      timestamp: Date.now(),
    });
  }

  emitToDevice(submission.deviceId, 'submission_status', {
    submissionId: submission.id,
    status: 'moderating',
    timestamp: Date.now(),
    deviceId: submission.deviceId,
  });

  setApprovalTimer(submission.id, (id) => {
    const sub = getSubmission(id);
    if (!sub || sub.status !== 'pending_approval') return;
    updateSubmissionStatus(id, 'rejected', 'Timed out');
    incrementStat('rejected');
    emitToDevice(sub.deviceId, 'submission_rejected', {
      submissionId: id,
      reason: 'Timed out',
      timestamp: Date.now(),
      deviceId: sub.deviceId,
    });
    removeSubmission(id);
  });
}

function approveAllPending(): void {
  for (const sub of getPendingApprovals()) {
    approveSubmission(sub.id);
  }
}

function approveSubmission(submissionId: string): void {
  const sub = getSubmission(submissionId);
  if (!sub || sub.status !== 'pending_approval') return;

  clearApprovalTimer(submissionId);
  updateSubmissionStatus(submissionId, 'queued');

  emitToDevice(sub.deviceId, 'submission_status', {
    submissionId,
    status: 'generating',
    timestamp: Date.now(),
    deviceId: sub.deviceId,
  });

  processGenerationQueue();
}

function rejectSubmission(submissionId: string, reason: string): void {
  const sub = getSubmission(submissionId);
  if (!sub) return;

  clearApprovalTimer(submissionId);
  updateSubmissionStatus(submissionId, 'rejected', reason);
  incrementStat('rejected');

  emitToDevice(sub.deviceId, 'submission_rejected', {
    submissionId,
    reason,
    timestamp: Date.now(),
    deviceId: sub.deviceId,
  });
  removeSubmission(submissionId);
}

interface ArtworkPayload {
  canvasDataURL: string;
  canvasDataURLFull?: string;
  textInput?: string;
  stylePreset: string;
  aiSettings: Submission['aiSettings'];
  deviceId: string;
  timestamp?: number;
}

io.on('connection', (socket) => {
  const { role, deviceId: clientDeviceId } = socket.handshake.query as {
    role?: string;
    deviceId?: string;
  };

  if (role === 'admin') {
    adminSockets.add(socket.id);
  }

  if (clientDeviceId && typeof clientDeviceId === 'string') {
    registerDevice(socket.id, clientDeviceId);
  }

  socket.emit('participant_count', {
    count: getParticipantCount(),
    timestamp: Date.now(),
  });

  if (role === 'display' && displayArtworks.length > 0) {
    for (const art of displayArtworks) {
      socket.emit('new_artwork_ready', {
        ...art,
        timestamp: Date.now(),
      });
    }
  }

  socket.on('register_device', (data: { deviceId: string; timestamp: number }) => {
    if (data?.deviceId) {
      registerDevice(socket.id, data.deviceId);
      broadcastParticipantCount();
    }
  });

  async function handleSubmitArtwork(payload: ArtworkPayload): Promise<void> {
    const deviceId = registeredDevices.get(socket.id) ?? payload.deviceId;
    if (!deviceId) {
      socket.emit('submission_rejected', {
        submissionId: null,
        reason: 'Device not registered',
        timestamp: Date.now(),
      });
      return;
    }

    if (paused) {
      emitToDevice(deviceId, 'submission_rejected', {
        submissionId: null,
        reason: 'Submissions are paused',
        timestamp: Date.now(),
        deviceId,
      });
      return;
    }

    const rateCheck = checkRateLimit(deviceId);
    if (!rateCheck.allowed) {
      emitToDevice(deviceId, 'rate_limit', {
        retryAfterMs: rateCheck.retryAfterMs,
        timestamp: Date.now(),
        deviceId,
      });
      return;
    }

    const result = createSubmission({
      deviceId,
      canvasDataURL: payload.canvasDataURL,
      canvasDataURLFull: payload.canvasDataURLFull,
      textInput: payload.textInput ?? '',
      stylePreset: payload.stylePreset,
      aiSettings: payload.aiSettings,
      priority: true,
    });

    if ('error' in result) {
      emitToDevice(deviceId, 'submission_rejected', {
        submissionId: null,
        reason: result.error,
        timestamp: Date.now(),
        deviceId,
      });
      return;
    }

    recordSubmission(deviceId);

    emitToDevice(deviceId, 'submission_received', {
      submissionId: result.id,
      position: getQueuePosition(result.id),
      timestamp: Date.now(),
      deviceId,
    });

    await runModerationAndQueue(result, socket);
  }

  socket.on('submit_artwork', handleSubmitArtwork);
  socket.on('add_to_queue', handleSubmitArtwork);

  socket.on('admin_approve', (data: { submissionId: string; adminToken: string }) => {
    if (!verifyAdminToken(data.adminToken)) return;
    approveSubmission(data.submissionId);
  });

  socket.on('admin_reject', (data: { submissionId: string; reason?: string; adminToken: string }) => {
    if (!verifyAdminToken(data.adminToken)) return;
    rejectSubmission(data.submissionId, data.reason ?? 'Rejected by admin');
  });

  socket.on('admin_clear', (data: { adminToken: string }) => {
    if (!verifyAdminToken(data.adminToken)) return;
    displayArtworks.length = 0;
    clearQueue();
    io.emit('wall_cleared', { timestamp: Date.now() });
  });

  socket.on('admin_pause', (data: { adminToken: string; paused: boolean }) => {
    if (!verifyAdminToken(data.adminToken)) return;
    paused = data.paused;
    io.emit('submissions_paused', { paused, timestamp: Date.now() });
  });

  socket.on('admin_clear_rate_limits', (data: { adminToken: string }) => {
    if (!verifyAdminToken(data.adminToken)) return;
    clearRateLimits();
    io.emit('rate_limits_cleared', { timestamp: Date.now() });
  });

  socket.on('admin_update_settings', (data: { adminToken: string; settings: Parameters<typeof updateModerationSettings>[0] }) => {
    if (!verifyAdminToken(data.adminToken)) return;
    updateModerationSettings(data.settings);
    if (data.settings.autoApprove) {
      approveAllPending();
    }
    io.to([...adminSockets]).emit('settings_updated', getModerationSettings());
  });

  socket.on('disconnect', () => {
    adminSockets.delete(socket.id);
    unregisterDevice(socket.id);
    broadcastParticipantCount();
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Graffiti Wall server running on http://0.0.0.0:${PORT}`);
  console.log(`Auto-approve: ${shouldAutoApprove() ? 'ON (dev default)' : 'OFF — use /admin to approve'}`);
  console.log(`Generation mode: ${getGenerationMode() === 'demo' ? 'DEMO (canvas only — add REPLICATE_API_TOKEN for AI)' : 'AI (Replicate SDXL)'}`);
  if (shouldAutoApprove()) {
    approveAllPending();
  }
});
