import express from 'express';
import { configureContainer } from '@infrastructure/di/ContainerConfig';
import { createAuthRoutes } from '@presentation/http/routes/auth.routes';
import { authMiddleware } from '@presentation/middleware/AuthMiddleware';
import { errorHandlerMiddleware } from '@presentation/middleware/ErrorHandlerMiddleware';
import { securityMiddleware } from '@presentation/middleware/SecurityMiddleware';

export function createApp(): express.Application {
  const container = configureContainer();
  const app = express();

  app.use(securityMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api/auth', createAuthRoutes(container.resolve('controller.auth')));

  app.get('/api/profile', authMiddleware, (req, res) => {
    res.json({
      userId: req.user?.userId,
      email: req.user?.email,
      message: 'This is a protected route',
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(errorHandlerMiddleware);

  return app;
}

