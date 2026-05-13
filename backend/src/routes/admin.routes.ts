import { Router } from 'express';
import * as c from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth';
const r = Router();
r.use(requireAuth, requireRole('ADMIN'));
r.get('/users', c.listUsers);
r.put('/users/:id/status', c.setActive);
r.put('/users/:id/role', c.setRole);
export default r;
