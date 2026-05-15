import { Response, NextFunction } from 'express';
import { db } from '../config/db';
import { AuthedRequest } from '../middleware/auth';
import { Role } from '@prisma/client';

export async function listUsers(_req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const users = await db.user.findMany({ orderBy: { createdAt: 'desc' }, include: { roles: true } });
    res.json({ users });
  } catch (e) { next(e); }
}
export async function setActive(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const u = await db.user.update({ where: { id: req.params.id }, data: { active: !!req.body.active } });
    res.json({ user: u });
  } catch (e) { next(e); }
}
export async function setRole(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const { role, on } = req.body as { role: Role; on: boolean };
    if (on) await db.userRole.upsert({ where: { userId_role: { userId: req.params.id, role } }, update: {}, create: { userId: req.params.id, role } });
    else await db.userRole.deleteMany({ where: { userId: req.params.id, role } });
    res.json({ ok: true });
  } catch (e) { next(e); }
}
export async function listWorkers(_req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const workers = await db.user.findMany({
      where: { roles: { some: { role: 'WORKER' } } },
      select: { id: true, fullName: true, email: true, phone: true, active: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ workers });
  } catch (e) { next(e); }
}
export async function setWorkerActive(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const u = await db.user.update({ where: { id: req.params.id }, data: { active: !!req.body.active } });
    res.json({ user: u });
  } catch (e) { next(e); }
}
export async function managerStats(_req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const [total, pending, assigned, in_progress, resolved, closed] = await Promise.all([
      db.issue.count(),
      db.issue.count({ where: { status: 'PENDING' } }),
      db.issue.count({ where: { status: 'ASSIGNED' } }),
      db.issue.count({ where: { status: 'IN_PROGRESS' } }),
      db.issue.count({ where: { status: 'RESOLVED' } }),
      db.issue.count({ where: { status: 'CLOSED' } }),
    ]);
    res.json({ stats: { total, pending, assigned, in_progress, resolved, closed } });
  } catch (e) { next(e); }
}
