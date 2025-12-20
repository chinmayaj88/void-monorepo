import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { Container } from '@infrastructure/di/Container';
import { createAuthMiddleware, createAdminMiddleware } from '@presentation/middleware/AuthMiddleware';
import { rateLimiters } from '@presentation/middleware/RateLimitMiddleware';
import { validate } from '@presentation/middleware/ValidationMiddleware';
import {
    registerUserSchema,
    loginSchema,
    verifyTotpSchema,
    refreshTokenSchema,
    logoutSchema,
    requestPasswordResetSchema,
    resetPasswordSchema,
    verifyEmailSchema,
    resendEmailVerificationSchema,
    changePasswordSchema,
    verifyDeviceSchema,
    setupPrimaryDeviceSchema,
    setupRecoveryEmailSchema,
    verifyRecoveryEmailSchema,
    revokeDeviceSchema,
    regenerateTotpSchema,
} from '../validators/auth.validators';

export function createAuthRoutes(container: Container): Router {
    const router = Router();
    const authController = container.resolve<AuthController>('controller.auth');
    const authMiddleware = createAuthMiddleware(container);
    const adminMiddleware = createAdminMiddleware();

    // Register user (admin only)
    router.post(
        '/register',
        authMiddleware,
        adminMiddleware,
        rateLimiters.auth,
        validate(registerUserSchema),
        async (req, res) => {
            await authController.register(req, res);
        }
    );

    // Login
    router.post(
        '/login',
        rateLimiters.login,
        validate(loginSchema),
        async (req, res) => {
            await authController.login(req, res);
        }
    );

    // Verify TOTP
    router.post(
        '/verify-totp',
        rateLimiters.totpVerification,
        validate(verifyTotpSchema),
        async (req, res) => {
            await authController.verifyTotp(req, res);
        }
    );

    // Refresh Token
    router.post(
        '/refresh',
        rateLimiters.general,
        validate(refreshTokenSchema),
        async (req, res) => {
            await authController.refreshToken(req, res);
        }
    );

    // Logout
    router.post(
        '/logout',
        authMiddleware,
        validate(logoutSchema),
        async (req, res) => {
            await authController.logout(req, res);
        }
    );

    // Password Reset
    router.post(
        '/request-password-reset',
        rateLimiters.passwordReset,
        validate(requestPasswordResetSchema),
        async (req, res) => {
            await authController.requestPasswordReset(req, res);
        }
    );

    router.post(
        '/reset-password',
        rateLimiters.passwordReset,
        validate(resetPasswordSchema),
        async (req, res) => {
            await authController.resetPassword(req, res);
        }
    );

    // Email Verification
    router.post(
        '/verify-email',
        rateLimiters.general,
        validate(verifyEmailSchema),
        async (req, res) => {
            await authController.verifyEmail(req, res);
        }
    );

    router.post(
        '/resend-email-verification',
        authMiddleware,
        rateLimiters.emailVerification,
        validate(resendEmailVerificationSchema),
        async (req, res) => {
            await authController.resendEmailVerification(req, res);
        }
    );

    // Change Password
    router.post(
        '/change-password',
        authMiddleware,
        rateLimiters.general,
        validate(changePasswordSchema),
        async (req, res) => {
            await authController.changePassword(req, res);
        }
    );

    // Device Management
    router.post(
        '/verify-device',
        rateLimiters.general,
        validate(verifyDeviceSchema),
        async (req, res) => {
            await authController.verifyDevice(req, res);
        }
    );

    router.get(
        '/devices',
        authMiddleware,
        async (req, res) => {
            await authController.listDevices(req, res);
        }
    );

    router.delete(
        '/devices/:deviceId',
        authMiddleware,
        validate(revokeDeviceSchema),
        async (req, res) => {
            await authController.revokeDevice(req, res);
        }
    );

    router.post(
        '/devices/primary',
        authMiddleware,
        validate(setupPrimaryDeviceSchema),
        async (req, res) => {
            await authController.setupPrimaryDevice(req, res);
        }
    );

    // Recovery Email
    router.post(
        '/recovery-email',
        authMiddleware,
        rateLimiters.general,
        validate(setupRecoveryEmailSchema),
        async (req, res) => {
            await authController.setupRecoveryEmail(req, res);
        }
    );

    router.post(
        '/verify-recovery-email',
        rateLimiters.general,
        validate(verifyRecoveryEmailSchema),
        async (req, res) => {
            await authController.verifyRecoveryEmail(req, res);
        }
    );

    // TOTP Management
    router.post(
        '/regenerate-totp',
        authMiddleware,
        rateLimiters.general,
        validate(regenerateTotpSchema),
        async (req, res) => {
            await authController.regenerateTotp(req, res);
        }
    );

    router.post(
        '/totp-backup-codes',
        authMiddleware,
        rateLimiters.general,
        async (req, res) => {
            await authController.generateTotpBackupCodes(req, res);
        }
    );

    return router;
}

