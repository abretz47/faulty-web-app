import express from 'express';
import { initSchema, seedData } from './db.js';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { tasksRouter } from './routes/tasks.js';
import { auditRouter } from './routes/audit.js';
import { usersRouter } from './routes/users.js';
import { logger } from './logger.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Parse JSON bodies
app.use(express.json());


// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/projects/:projectId/tasks', tasksRouter);
app.use('/api/audit', auditRouter);
app.use('/api/users', usersRouter);

// Generic error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  initSchema();
  await seedData();

  app.listen(PORT, () => {
    logger.info(`API server running on http://localhost:${PORT}`);
  });
}

// Don't start the HTTP server when imported by the test runner
if (process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });
}

export { app };
