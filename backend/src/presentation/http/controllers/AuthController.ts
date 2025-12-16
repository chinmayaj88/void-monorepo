import { Request, Response } from 'express';
import { RegisterUserUseCase } from '@application/use-cases/auth/RegisterUserUseCase';
import { VerifyCredentialsUseCase } from '@application/use-cases/auth/VerifyCredentialsUseCase';
import { VerifyTotpUseCase } from '@application/use-cases/auth/VerifyTotpUseCase';
import { RefreshTokenUseCase } from '@application/use-cases/auth/RefreshTokenUseCase';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase';
import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';

export class AuthController {
    constructor(
        private readonly registerUserUseCase: RegisterUserUseCase,
        private readonly verifyCredentialsUseCase: VerifyCredentialsUseCase,
        private readonly verifyTotpUseCase: VerifyTotpUseCase,
        private readonly refreshTokenUseCase: RefreshTokenUseCase,
        private readonly logoutUseCase: LogoutUseCase
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
        });
    }

    async verifyCredentials(req: Request, res: Response): Promise<void> {
        const { email, password } = req.body;

        const result = await this.verifyCredentialsUseCase.execute({
            email,
            password,
        });

        res.status(200).json({
            sessionToken: result.sessionToken,
            expiresIn: result.expiresIn,
        });
    }

    async verifyTotp(req: Request, res: Response): Promise<void> {
        const { sessionToken, totpCode } = req.body;

        const result = await this.verifyTotpUseCase.execute({
            sessionToken,
            totpCode,
        });

        res.status(200).json({
            userId: result.userId,
            email: result.email,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
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
}