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
import { SetupPrimaryDeviceUseCase } from '@application/use-cases/auth/SetupPrimaryDeviceUseCase';
import { VerifyDeviceUseCase } from '@application/use-cases/auth/VerifyDeviceUseCase';
import { SetupRecoveryEmailUseCase } from '@application/use-cases/auth/SetupRecoveryEmailUseCase';
import { VerifyRecoveryEmailUseCase } from '@application/use-cases/auth/VerifyRecoveryEmailUseCase';
import { RevokeDeviceUseCase } from '@application/use-cases/auth/RevokeDeviceUseCase';
import { ListDevicesUseCase } from '@application/use-cases/auth/ListDevicesUseCase';
import { RegenerateTotpUseCase } from '@application/use-cases/auth/RegenerateTotpUseCase';
import { GenerateTotpBackupCodesUseCase } from '@application/use-cases/auth/GenerateTotpBackupCodesUseCase';
import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';

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
        private readonly setupPrimaryDeviceUseCase: SetupPrimaryDeviceUseCase,
        private readonly verifyDeviceUseCase: VerifyDeviceUseCase,
        private readonly setupRecoveryEmailUseCase: SetupRecoveryEmailUseCase,
        private readonly verifyRecoveryEmailUseCase: VerifyRecoveryEmailUseCase,
        private readonly revokeDeviceUseCase: RevokeDeviceUseCase,
        private readonly listDevicesUseCase: ListDevicesUseCase,
        private readonly regenerateTotpUseCase: RegenerateTotpUseCase,
        private readonly generateTotpBackupCodesUseCase: GenerateTotpBackupCodesUseCase
    ) { }

    async register(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;

        const passwordHash = await PasswordHasher.hash(password);

        const result = await this.registerUserUseCase.execute({
            email,
            passwordHash,
        });

        res.status(201).json({
            userId: result.userId,
            email: result.email,
            totpSecret: result.totpSecret,
            qrCodeUrl: result.qrCodeUrl,
            message: result.message,
        });
    }

    async login(req: Request, res: Response): Promise<void> {
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
        });

        res.status(200).json({
            sessionToken: result.sessionToken,
            expiresIn: result.expiresIn,
            requiresDeviceVerification: result.requiresDeviceVerification || false,
            deviceId: result.deviceId,
            verificationToken: result.verificationToken,
            message: result.message,
        });
    }

    async verifyTotp(req: Request, res: Response): Promise<void> {
        const { sessionToken, totpCode, deviceId } = req.body;

        const result = await this.verifyTotpUseCase.execute({
            sessionToken,
            totpCode,
            deviceId,
        });

        res.status(200).json({
            userId: result.userId,
            email: result.email,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            deviceId: result.deviceId,
        });
    }

    async refreshToken(req: Request, res: Response): Promise<void> {
        const { refreshToken } = req.body;

        const result = await this.refreshTokenUseCase.execute({
            refreshToken,
        });

        res.status(200).json({
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
        });
    }

    async logout(req: Request, res: Response): Promise<void> {
        const { refreshToken } = req.body;

        const result = await this.logoutUseCase.execute({
            refreshToken,
        });

        res.status(200).json({
            success: result.success,
            message: result.message,
        });
    }

    async requestPasswordReset(req: Request, res: Response): Promise<void> {
        const { email } = req.body;

        const result = await this.requestPasswordResetUseCase.execute({
            email,
        });

        res.status(200).json(result);
    }

    async resetPassword(req: Request, res: Response): Promise<void> {
        const { token, newPassword } = req.body;

        const result = await this.resetPasswordUseCase.execute({
            token,
            newPassword,
        });

        res.status(200).json(result);
    }

    async verifyEmail(req: Request, res: Response): Promise<void> {
        const { token } = req.body;

        const result = await this.verifyEmailUseCase.execute({
            token,
        });

        res.status(200).json(result);
    }

    async resendEmailVerification(req: Request, res: Response): Promise<void> {
        const { email } = req.body;

        const result = await this.resendEmailVerificationUseCase.execute({
            email,
        });

        res.status(200).json(result);
    }

    async changePassword(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { currentPassword, newPassword } = req.body;

        const result = await this.changePasswordUseCase.execute({
            userId,
            currentPassword,
            newPassword,
        });

        res.status(200).json(result);
    }

    async setupPrimaryDevice(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { deviceName } = req.body;
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';

        const result = await this.setupPrimaryDeviceUseCase.execute({
            userId,
            deviceInfo: {
                userAgent,
                ipAddress,
                deviceName,
            },
        });

        res.status(200).json(result);
    }

    async verifyDevice(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { deviceId, verificationToken } = req.body;

        const result = await this.verifyDeviceUseCase.execute({
            userId,
            deviceId,
            verificationToken,
        });

        res.status(200).json(result);
    }

    async setupRecoveryEmail(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { recoveryEmail } = req.body;

        const result = await this.setupRecoveryEmailUseCase.execute({
            userId,
            recoveryEmail,
        });

        res.status(200).json(result);
    }

    async verifyRecoveryEmail(req: Request, res: Response): Promise<void> {
        const { token } = req.body;

        const result = await this.verifyRecoveryEmailUseCase.execute({
            token,
        });

        res.status(200).json(result);
    }

    async revokeDevice(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { deviceId } = req.body;

        const result = await this.revokeDeviceUseCase.execute({
            userId,
            deviceId,
        });

        res.status(200).json(result);
    }

    async listDevices(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const result = await this.listDevicesUseCase.execute({
            userId,
        });

        res.status(200).json(result);
    }

    async regenerateTotp(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const result = await this.regenerateTotpUseCase.execute({
            userId,
        });

        res.status(200).json(result);
    }

    async generateTotpBackupCodes(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { count } = req.body;

        const result = await this.generateTotpBackupCodesUseCase.execute({
            userId,
            count,
        });

        res.status(200).json(result);
    }
}