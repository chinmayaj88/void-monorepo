import { Router } from 'express';
import { AuthController } from '@presentation/http/controllers/AuthController';
import { validateBody } from '@presentation/middleware/ValidationMiddleware';
import { rateLimiters } from '@presentation/middleware/RateLimitMiddleware';
import { asyncHandler } from '@presentation/middleware/ErrorHandlerMiddleware';
import { authMiddleware } from '@presentation/middleware/AuthMiddleware';
import {
  registerSchema,
  loginSchema,
  verifyTotpSchema,
  refreshTokenSchema,
  logoutSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendEmailVerificationSchema,
  changePasswordSchema,
  setupPrimaryDeviceSchema,
  verifyDeviceSchema,
  revokeDeviceSchema,
  setupRecoveryEmailSchema,
  verifyRecoveryEmailSchema,
  regenerateTotpSchema,
  generateTotpBackupCodesSchema,
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
    '/login',
    rateLimiters.auth,
    validateBody(loginSchema),
    asyncHandler((req, res) => authController.login(req, res))
  );

  router.post(
    '/verify-totp',
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

  // Password reset
  router.post(
    '/password/reset/request',
    rateLimiters.auth,
    validateBody(requestPasswordResetSchema),
    asyncHandler((req, res) => authController.requestPasswordReset(req, res))
  );

  router.post(
    '/password/reset',
    rateLimiters.auth,
    validateBody(resetPasswordSchema),
    asyncHandler((req, res) => authController.resetPassword(req, res))
  );

  // Email verification
  router.post(
    '/email/verify',
    rateLimiters.general,
    validateBody(verifyEmailSchema),
    asyncHandler((req, res) => authController.verifyEmail(req, res))
  );

  router.post(
    '/email/verify/resend',
    rateLimiters.auth,
    validateBody(resendEmailVerificationSchema),
    asyncHandler((req, res) => authController.resendEmailVerification(req, res))
  );

  // Change password (requires authentication)
  router.post(
    '/password/change',
    authMiddleware,
    rateLimiters.general,
    validateBody(changePasswordSchema),
    asyncHandler((req, res) => authController.changePassword(req, res))
  );

  // Device management (requires authentication)
  router.post(
    '/device/primary/setup',
    authMiddleware,
    rateLimiters.general,
    validateBody(setupPrimaryDeviceSchema),
    asyncHandler((req, res) => authController.setupPrimaryDevice(req, res))
  );

  router.post(
    '/device/verify',
    authMiddleware,
    rateLimiters.general,
    validateBody(verifyDeviceSchema),
    asyncHandler((req, res) => authController.verifyDevice(req, res))
  );

  router.post(
    '/device/revoke',
    authMiddleware,
    rateLimiters.general,
    validateBody(revokeDeviceSchema),
    asyncHandler((req, res) => authController.revokeDevice(req, res))
  );

  router.get(
    '/devices',
    authMiddleware,
    rateLimiters.general,
    asyncHandler((req, res) => authController.listDevices(req, res))
  );

  // Recovery email (requires authentication)
  router.post(
    '/recovery-email/setup',
    authMiddleware,
    rateLimiters.general,
    validateBody(setupRecoveryEmailSchema),
    asyncHandler((req, res) => authController.setupRecoveryEmail(req, res))
  );

  router.post(
    '/recovery-email/verify',
    rateLimiters.general,
    validateBody(verifyRecoveryEmailSchema),
    asyncHandler((req, res) => authController.verifyRecoveryEmail(req, res))
  );

  // TOTP management (requires authentication)
  router.post(
    '/totp/regenerate',
    authMiddleware,
    rateLimiters.general,
    validateBody(regenerateTotpSchema),
    asyncHandler((req, res) => authController.regenerateTotp(req, res))
  );

  router.post(
    '/totp/backup-codes',
    authMiddleware,
    rateLimiters.general,
    validateBody(generateTotpBackupCodesSchema),
    asyncHandler((req, res) => authController.generateTotpBackupCodes(req, res))
  );

  return router;
}