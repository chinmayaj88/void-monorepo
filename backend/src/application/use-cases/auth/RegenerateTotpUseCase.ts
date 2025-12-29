import { UserId } from '@domain/value-objects/UserId';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { authenticator } from 'otplib';
import { logger } from '@infrastructure/config/Logger';

export interface RegenerateTotpInput {
    userId: string;
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

        // Find user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Generate new TOTP secret
        const newTotpSecret = authenticator.generateSecret();

        // Update user's TOTP secret in database
        await this.userRepository.updateTotpSecret(userId, newTotpSecret);

        const serviceName = process.env.TOTP_ISSUER || 'Void Cloud Drive';
        const qrCodeUrl = authenticator.keyuri(
            user.getEmail().toString(),
            serviceName,
            newTotpSecret
        );

        logger.info('TOTP secret regenerated', {
            userId: userId.toString(),
        });

        return {
            totpSecret: newTotpSecret,
            qrCodeUrl,
            message: 'TOTP secret has been regenerated. Please update your authenticator app with the new QR code.',
        };
    }
}

