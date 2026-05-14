import { Router } from 'express';
import * as c from '../controllers/issues.controller';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
// ======================
// Issue CRUD Routes
// ======================
const r = Router();
r.use(requireAuth);
/**
 * @swagger
 * /api/issues:
 *   get:
 *     summary: Retrieve all issues
 */
r.get('/', c.list);
r.get('/my', c.listMine);
r.get('/:id', c.get);
r.post('/', c.create);
r.put('/:id/status', c.setStatus);
r.put('/:id/assign', c.assign);
r.put('/:id/close', c.close);
r.post('/:id/comments', c.comment);
r.post('/:id/photo', upload.single('photo'), c.uploadPhoto);
r.delete('/:id', c.remove);
export default r;
