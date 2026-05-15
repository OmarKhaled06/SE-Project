import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import authRoutes from './routes/auth.routes';
import issueRoutes from './routes/issues.routes';
import notificationRoutes from './routes/notifications.routes';
import managerRoutes from './routes/manager.routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler } from './middleware/error';
import { db } from './config/db';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 60_000, max: 200 }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/db-health', async (_req, res) => {
  try { await db.$queryRaw`SELECT 1`; res.json({ db: 'ok' }); }
  catch (e: any) { res.status(500).json({ db: 'error', message: e.message }); }
});
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/uploads', express.static('uploads'));

app.use(errorHandler);

const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API ready on http://localhost:${port}`));


// test commit - added by Omar