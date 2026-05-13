import { Router } from 'express';
import * as c from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth';
const r = Router();
/**
 * @openapi
 * /api/auth/register:
 *   post: { summary: Register, responses: { 201: { description: Created } } }
 */
r.post('/register', c.register);
r.post('/login', c.login);
r.post('/logout', c.logout);
r.get('/me', requireAuth, c.me);
export default r;
