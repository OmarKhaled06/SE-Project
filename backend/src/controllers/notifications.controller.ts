import { Response, NextFunction } from 'express';
import { db } from '../config/db';
import { AuthedRequest } from '../middleware/auth';
export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const items = await db.notification.findMany({
      where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 100,
    });
    res.json({ notifications: items });
  } catch (e) { next(e); }
}
export async function markRead(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    await db.notification.updateMany({ where: { userId: req.user!.id, read: false }, data: { read: true } });
    res.json({ ok: true });
  } catch (e) { next(e); }
}
