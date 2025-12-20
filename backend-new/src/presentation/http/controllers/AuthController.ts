import { Request, Response } from 'express';
import { RegisterUserUseCase } from '@application/use-cases/auth/RegisterUserUseCase';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase';
import { VerifyTotpUseCase } from '@application/use-cases/auth/VerifyTotpUseCase';
import { RefreshTokenUseCase } from '@application/use-cases/auth/RefreshTokenUseCase';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase';
import { RequestPasswordResetUseCase } from '@application/use-cases/auth/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '@application/use-cases/auth/ResetPasswordUseCase';
import { VerifyEmailUseCase } from '@application/use-cases/auth/VerifyEmailUseCase';
import { ResendEmailVerificationUseCase } from '@application/use-cases/auth/ResendEmailVerificationUseCase';
import { ChangePasswordUseCase } from '@application/use-cases/auth/ChangePasswordUseCase';
import { VerifyDeviceUseCase } from '@application/use-cases/auth/VerifyDeviceUseCase';
import { ListDevicesUseCase } from '@application/use-cases/auth/ListDevicesUseCase';
import { RevokeDeviceUseCase } from '@application/use-cases/auth/RevokeDeviceUseCase';
import { SetupPrimaryDeviceUseCase } from '@application/use-cases/auth/SetupPrimaryDeviceUseCase';
import { SetupRecoveryEmailUseCase } from '@application/use-cases/auth/SetupRecoveryEmailUseCase';
import { VerifyRecoveryEmailUseCase } from '@application/use-cases/auth/VerifyRecoveryEmailUseCase';
import { RegenerateTotpUseCase } from '@application/use-cases/auth/RegenerateTotpUseCase';
import { GenerateTotpBackupCodesUseCase } from '@application/use-cases/auth/GenerateTotpBackupCodesUseCase';

export class AuthController {
    constructor(
        private readonly registerUserUseCase: RegisterUserUseCase,
        private readonly loginUseCase: LoginUseCase,
        private readonly verifyTotpUseCase: VerifyTotpUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
        private readonly logoutUseCase: LogoutUseCase,
        private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
        private readonly resetPasswordUseCase: ResetPasswordUseCase,
        private readonly verifyEmailUseCase: VerifyEmailUseCase,
        private readonly resendEmailVerificationUseCase: ResendEmailVerificationUseCase,
        private readonly changePasswordUseCase: ChangePasswordUseCase,
        private readonly verifyDeviceUseCase: VerifyDeviceUseCase,
        private readonly listDevicesUseCase: ListDevicesUseCase,
        private readonly revokeDeviceUseCase: RevokeDeviceUseCase,
        private readonly setupPrimaryDeviceUseCase: SetupPrimaryDeviceUseCase,
        private readonly setupRecoveryEmailUseCase: SetupRecoveryEmailUseCase,
        private readonly verifyRecoveryEmailUseCase: VerifyRecoveryEmailUseCase,
        private readonly regenerateTotpUseCase: RegenerateTotpUseCase,
        private readonly generateTotpBackupCodesUseCase: GenerateTotpBackupCodesUseCase
    ) {}

    async register(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const adminUserId = req.user?.userId; // Admin user ID from auth middleware

            if (!adminUserId) {
                res.status(403).json({
                    error: 'Only admins can register new users',
                });
                return;
            }

            const result = await this.registerUserUseCase.execute({
                email,
                password,
                adminUserId,
            });

            res.status(201).json({
                userId: result.userId,
                email: result.email,
                totpSecret: result.totpSecret,
                qrCodeUrl: result.qrCodeUrl,
                message: result.message,
            });
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Registration failed',
            });
        }
    }

    async login(req: Request, res: Response): Promise<void> {
        try {
            const { email, password } = req.body;
            const userAgent = req.headers['user-agent'] || '';
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

            const result = await this.loginUseCase.execute({
                email,
                password,
                deviceInfo: {
                    userAgent,
                    ipAddress,
                },
                ipAddress,
                userAgent,
            });

            res.status(200).json({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                expiresIn: result.expiresIn,
                requiresDeviceVerification: result.requiresDeviceVerification || false,
                deviceId: result.deviceId,
                verificationToken: result.verificationToken,
                message: result.message,
            });
        } catch (error) {
            res.status(401).json({
                error: error instanceof Error ? error.message : 'Login failed',
            });
        }
    }

    async verifyTotp(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken, totpCode, deviceId } = req.body;

            const result = await this.verifyTotpUseCase.execute({
                refreshToken,
                totpCode,
                deviceId,
            });

            res.status(200).json({
                userId: result.userId,
                email: result.email,
                role: result.role,
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
                deviceId: result.deviceId,
            });
        } catch (error) {
            res.status(401).json({
                error: error instanceof Error ? error.message : 'TOTP verification failed',
            });
        }
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            const result = await this.refreshTokenUseCase.execute({
                refreshToken,
            });

            res.status(200).json({
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            });
        } catch (error) {
            res.status(401).json({
                error: error instanceof Error ? error.message : 'Token refresh failed',
            });
        }
    }

    async logout(req: Request, res: Response): Promise<void> {
        try {
            const { refreshToken } = req.body;

            const result = await this.logoutUseCase.execute({
                refreshToken,
            });

            res.status(200).json({
                success: result.success,
                message: result.message,
            });
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Logout failed',
            });
        }
    }

    async requestPasswordReset(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            const result = await this.requestPasswordResetUseCase.execute({ email });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Password reset request failed',
            });
        }
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        try {
            const { token, newPassword } = req.body;
            const result = await this.resetPasswordUseCase.execute({ token, newPassword });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Password reset failed',
            });
        }
    }

    async verifyEmail(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.body;
            const result = await this.verifyEmailUseCase.execute({ token });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Email verification failed',
            });
        }
    }

    async resendEmailVerification(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            const userId = req.user?.userId;
            const result = await this.resendEmailVerificationUseCase.execute({ email, userId });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Failed to resend verification email',
            });
        }
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        try {
            const { currentPassword, newPassword } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const result = await this.changePasswordUseCase.execute({ userId, currentPassword, newPassword });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Password change failed',
            });
        }
    }

    async verifyDevice(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.body;
            const result = await this.verifyDeviceUseCase.execute({ token });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Device verification failed',
            });
        }
    }

    async listDevices(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const result = await this.listDevicesUseCase.execute({ userId });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Failed to list devices',
            });
        }
    }

    async revokeDevice(req: Request, res: Response): Promise<void> {
        try {
            const { deviceId } = req.params;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const result = await this.revokeDeviceUseCase.execute({ userId, deviceId });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Failed to revoke device',
            });
        }
    }

    async setupPrimaryDevice(req: Request, res: Response): Promise<void> {
        try {
            const { deviceId } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const result = await this.setupPrimaryDeviceUseCase.execute({ userId, deviceId });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Failed to set primary device',
            });
        }
    }

    async setupRecoveryEmail(req: Request, res: Response): Promise<void> {
        try {
            const { email } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const result = await this.setupRecoveryEmailUseCase.execute({ userId, email });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Failed to setup recovery email',
            });
        }
    }

    async verifyRecoveryEmail(req: Request, res: Response): Promise<void> {
        try {
            const { token } = req.body;
            const result = await this.verifyRecoveryEmailUseCase.execute({ token });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Recovery email verification failed',
            });
        }
    }

    async regenerateTotp(req: Request, res: Response): Promise<void> {
        try {
            const { password } = req.body;
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const result = await this.regenerateTotpUseCase.execute({ userId, password });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Failed to regenerate TOTP',
            });
        }
    }

    async generateTotpBackupCodes(req: Request, res: Response): Promise<void> {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                res.status(401).json({ error: 'Unauthorized' });
                return;
            }
            const result = await this.generateTotpBackupCodesUseCase.execute({ userId });
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({
                error: error instanceof Error ? error.message : 'Failed to generate backup codes',
            });
        }
    }
}

