import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export interface VerifyDeviceInput {
    token: string;
}

export interface VerifyDeviceOutput {
    success: boolean;
    message: string;
    deviceId: string;
}

export class VerifyDeviceUseCase {
    constructor(
        private readonly deviceRepository: IDeviceRepository
    ) {}

    async execute(input: VerifyDeviceInput): Promise<VerifyDeviceOutput> {
        // Find device by verification token
        const device = await this.deviceRepository.findByVerificationToken(input.token);

        if (!device) {
            throw new InvalidCredentialsError();
        }

        // Check if token is expired
        if (device.verificationExpiresAt && device.verificationExpiresAt < new Date()) {
            throw new InvalidCredentialsError();
        }

        // Mark device as verified
        device.isVerified = true;
        device.verificationToken = null;
        device.verificationExpiresAt = null;
        await this.deviceRepository.save(device);

        logger.info('Device verified', {
            deviceId: device.id,
            userId: device.userId,
        });

        return {
            success: true,
            message: 'Device has been verified successfully.',
            deviceId: device.id,
        };
    }
}

