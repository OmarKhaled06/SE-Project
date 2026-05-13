import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { Role } from '@prisma/client';

export interface AuthedRequest extends Request {
  user?: { id: string; email: string; roles: Role[] };
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as { sub: string };
    const user = await db.user.findUnique({
      where: { id: decoded.sub },
      include: { roles: true },
    });
    if (!user || !user.active) return res.status(401).json({ error: 'Invalid user' });
    req.user = { id: user.id, email: user.email, roles: user.roles.map((r) => r.role) };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export const requireRole = (...roles: Role[]) =>
  (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    if (!req.user.roles.some((r) => roles.includes(r)))
      return res.status(403).json({ error: 'Forbidden' });
    next();
  };
