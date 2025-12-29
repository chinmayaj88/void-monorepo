import express from 'express';
import { configureContainer } from '@infrastructure/di/ContainerConfig';
import { createAuthRoutes } from '@presentation/http/routes/auth.routes';
import { createFileRoutes } from '@presentation/http/routes/file.routes';
import { FileController } from '@presentation/http/controllers/FileController';
import { authMiddleware } from '@presentation/middleware/AuthMiddleware';
import { errorHandlerMiddleware } from '@presentation/middleware/ErrorHandlerMiddleware';
import { securityMiddleware } from '@presentation/middleware/SecurityMiddleware';

export function createApp(): express.Application {
  const container = configureContainer();
  const app = express();

  // CORS configuration
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    app.use((req, res, next) => {
      res.setHeader('Access-Control-Allow-Origin', corsOrigin);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });
  }

  app.use(securityMiddleware);
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use('/api/auth', createAuthRoutes(container.resolve('controller.auth')));
  app.use('/api/files', createFileRoutes(container.resolve<FileController>('controller.file')));

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

