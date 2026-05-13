import { Router } from 'express';
import * as c from '../controllers/notifications.controller';
import { requireAuth } from '../middleware/auth';
const r = Router();
r.use(requireAuth);
r.get('/', c.list);
r.put('/read-all', c.markRead);
export default r;
