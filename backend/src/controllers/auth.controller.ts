import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';
import { registerSchema, loginSchema } from '../validators/schemas';

const sign = (id: string) =>
  jwt.sign({ sub: id }, process.env.JWT_SECRET!, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any);

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const data = registerSchema.parse(req.body);
    const exists = await db.user.findUnique({ where: { email: data.email } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await db.user.create({
      data: {
        email: data.email, fullName: data.fullName, phone: data.phone, passwordHash,
        roles: { create: { role: 'MEMBER' } },
      },
      include: { roles: true },
    });
    res.status(201).json({ token: sign(user.id), user: sanitize(user) });
  } catch (e) { next(e); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const data = loginSchema.parse(req.body);
    const user = await db.user.findUnique({ where: { email: data.email }, include: { roles: true } });
    if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: sign(user.id), user: sanitize(user) });
  } catch (e) { next(e); }
}

export function logout(_req: Request, res: Response) { res.json({ ok: true }); }

export async function me(req: any, res: Response) {
  const user = await db.user.findUnique({ where: { id: req.user.id }, include: { roles: true } });
  res.json({ user: user ? sanitize(user) : null });
}

function sanitize(u: any) {
  return { id: u.id, email: u.email, fullName: u.fullName, phone: u.phone, active: u.active, roles: u.roles.map((r: any) => r.role) };
}
