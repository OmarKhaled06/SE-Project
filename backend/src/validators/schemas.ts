import { z } from 'zod';
export const registerSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(72),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(20).optional(),
  role: z.enum(['MEMBER', 'MANAGER', 'WORKER']).optional(),
});
export const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(72),
});
export const issueSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  location: z.string().trim().min(2).max(200),
  category: z.enum(['ELECTRICAL','PLUMBING','HVAC','CLEANING','FURNITURE','SAFETY','IT','OTHER']),
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']).default('MEDIUM'),
});
export const statusSchema = z.object({
  status: z.enum(['PENDING','ASSIGNED','IN_PROGRESS','RESOLVED','CLOSED']),
});
export const assignSchema = z.object({ assigneeId: z.string().uuid().nullable() });
export const commentSchema = z.object({ body: z.string().trim().min(1).max(1000) });
export const prioritySchema = z.object({
  priority: z.enum(['LOW','MEDIUM','HIGH','URGENT']),
});
