import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import config from './config/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.routes.js';
import { formRoutes, formBuilderRoutes } from './routes/form.routes.js';
import hrmsRoutes from './routes/hrms.routes.js';
import requestRoutes from './routes/request.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import {
  workflowRoutes,
  dashboardRoutes,
  searchRoutes,
  auditRoutes,
  departmentRoutes,
  notificationRoutes,
  uploadRoutes,
  filesRoutes,
} from './routes/misc.routes.js';
import settingsRoutes from './routes/settings.routes.js';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 800 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health'
    || req.originalUrl.startsWith('/api/health')
    || req.originalUrl.startsWith('/api/uploads/')
    || req.originalUrl.startsWith('/api/files/serve'),
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please wait a moment and try again.',
    });
  },
});
app.use('/api/', limiter);

app.use('/uploads', express.static(config.paths.uploads));
app.use('/api/uploads', express.static(config.paths.uploads));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Service Portal API is running', data: { env: config.nodeEnv } });
});

app.use('/api/auth', authRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/form-builder', formBuilderRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/hrms', hrmsRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/settings', settingsRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
