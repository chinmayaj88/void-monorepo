import { Router } from 'express';
import { AuthController } from '@presentation/http/controllers/AuthController';
import { validateBody } from '@presentation/middleware/ValidationMiddleware';
import { rateLimiters } from '@presentation/middleware/RateLimitMiddleware';
import { asyncHandler } from '@presentation/middleware/ErrorHandlerMiddleware';
import {
  registerSchema,
  verifyCredentialsSchema,
  verifyTotpSchema,
  refreshTokenSchema,
  logoutSchema,
} from '@presentation/http/validators/auth.validators';

export function createAuthRoutes(
  authController: AuthController
): Router {
  const router = Router();

  router.post(
    '/register',
    rateLimiters.auth,
    validateBody(registerSchema),
    asyncHandler((req, res) => authController.register(req, res))
  );

  router.post(
    '/login/verify-credentials',
    rateLimiters.auth,
    validateBody(verifyCredentialsSchema),
    asyncHandler((req, res) => authController.verifyCredentials(req, res))
  );

  router.post(
    '/login/verify-totp',
    rateLimiters.auth,
    validateBody(verifyTotpSchema),
    asyncHandler((req, res) => authController.verifyTotp(req, res))
  );

  router.post(
    '/refresh',
    rateLimiters.general,
    validateBody(refreshTokenSchema),
    asyncHandler((req, res) => authController.refreshToken(req, res))
  );

  router.post(
    '/logout',
    rateLimiters.general,
    validateBody(logoutSchema),
    asyncHandler((req, res) => authController.logout(req, res))
  );

  return router;
}