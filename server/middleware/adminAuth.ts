import type { Request, Response, NextFunction } from 'express';

export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return password === expected;
}

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-admin-token'] as string | undefined;
  if (!token || !verifyAdminPassword(token)) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

export function verifyAdminToken(token: string): boolean {
  return verifyAdminPassword(token);
}
