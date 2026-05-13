import { Router } from 'express';
import * as c from '../controllers/admin.controller';
import { requireAuth, requireRole } from '../middleware/auth';
const r = Router();
r.use(requireAuth, requireRole('MANAGER', 'ADMIN'));
r.get('/workers', c.listWorkers);
export default r;
