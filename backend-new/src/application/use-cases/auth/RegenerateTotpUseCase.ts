import { IUserRepository } from '@application/interfaces/IUserRepository';
import { UserId } from '@domain/value-objects/UserId';
import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { authenticator } from 'otplib';
import { logger } from '@infrastructure/config/Logger';

export interface RegenerateTotpInput {
    userId: string;
    password: string;
}

export interface RegenerateTotpOutput {
    totpSecret: string;
    qrCodeUrl: string;
    message: string;
}

export class RegenerateTotpUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(input: RegenerateTotpInput): Promise<RegenerateTotpOutput> {
        const userId = UserId.fromString(input.userId);
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new InvalidCredentialsError();
        }

        // Verify password
        const isPasswordValid = await PasswordHasher.verify(
            user.getPasswordHash(),
            input.password
        );

        if (!isPasswordValid) {
            throw new InvalidCredentialsError();
        }

        // Generate new TOTP secret
        const newTotpSecret = authenticator.generateSecret();
        user.updateTotpSecret(newTotpSecret);
        await this.userRepository.save(user);

        // Generate QR code URL
        const serviceName = process.env.TOTP_ISSUER || 'Void Cloud Drive';
        const qrCodeUrl = authenticator.keyuri(
            user.getEmail().toString(),
            serviceName,
            newTotpSecret
        );

        logger.info('TOTP regenerated', {
            userId: user.getId().toString(),
            email: user.getEmail().toString(),
        });

        return {
            totpSecret: newTotpSecret,
            qrCodeUrl,
            message: 'TOTP secret has been regenerated. Please scan the QR code with your authenticator app.',
        };
    }
}


