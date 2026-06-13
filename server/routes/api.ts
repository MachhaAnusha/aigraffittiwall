import { Router } from 'express';
import { adminAuthMiddleware, verifyAdminPassword } from '../middleware/adminAuth.js';
import {
  getModerationSettings,
  updateModerationSettings,
} from '../services/moderationService.js';
import { getStats } from '../services/queueService.js';
import { getGenerationMode } from '../services/aiGenerationService.js';

const router = Router();

router.post('/admin/login', (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || !verifyAdminPassword(password)) {
    res.status(401).json({ error: 'Invalid password' });
    return;
  }
  res.json({ token: password });
});

router.get('/admin/settings', adminAuthMiddleware, (_req, res) => {
  res.json(getModerationSettings());
});

router.put('/admin/settings', adminAuthMiddleware, (req, res) => {
  updateModerationSettings(req.body);
  res.json(getModerationSettings());
});

router.get('/admin/stats', adminAuthMiddleware, (_req, res) => {
  res.json(getStats());
});

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    timestamp: Date.now(),
    generationMode: getGenerationMode(),
    hasReplicate: Boolean(process.env.REPLICATE_API_TOKEN),
    hasCloudinary: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    ),
  });
});

export default router;
