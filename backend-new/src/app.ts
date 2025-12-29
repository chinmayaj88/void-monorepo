import express from 'express';
import { configureContainer } from '@infrastructure/di/ContainerConfig';
import { createAuthRoutes } from '@presentation/http/routes/auth.routes';
import { createAuthMiddleware } from '@presentation/middleware/AuthMiddleware';
import { errorHandlerMiddleware } from '@presentation/middleware/ErrorHandlerMiddleware';
import { securityHeadersMiddleware } from '@presentation/middleware/SecurityHeadersMiddleware';
import { rateLimiters } from '@presentation/middleware/RateLimitMiddleware';

export function createApp(): express.Application {
  const container = configureContainer();
  const app = express();

  // Security headers (apply to all routes)
  app.use(securityHeadersMiddleware);

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

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // General rate limiting for all routes
  app.use(rateLimiters.general);

  app.use('/api/auth', createAuthRoutes(container));

  app.get('/api/profile', createAuthMiddleware(container), (req, res) => {
    res.json({
      userId: req.user?.userId,
      email: req.user?.email,
      role: req.user?.role,
      message: 'This is a protected route',
    });
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use(errorHandlerMiddleware);

  return app;
}

