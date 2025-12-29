import { UserId } from '@domain/value-objects/UserId';
import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { logger } from '@infrastructure/config/Logger';

export interface VerifyDeviceInput {
    userId: string;
    deviceId: string;
    verificationToken: string;
}

export interface VerifyDeviceOutput {
    success: boolean;
    message: string;
    deviceId: string;
}

export class VerifyDeviceUseCase {
    constructor(private readonly deviceRepository: IDeviceRepository) {}

    async execute(input: VerifyDeviceInput): Promise<VerifyDeviceOutput> {
        const userId = UserId.fromString(input.userId);

        // Find device
        const device = await this.deviceRepository.findById(input.deviceId);
        if (!device) {
            throw new Error('Device not found');
        }

        // Verify ownership
        if (device.userId !== userId.toString()) {
            throw new Error('Device does not belong to user');
        }

        // Check if already verified
        if (device.isVerified) {
            return {
                success: true,
                message: 'Device is already verified.',
                deviceId: device.id,
            };
        }

        // Verify token
        if (!device.verificationToken || device.verificationToken !== input.verificationToken) {
            throw new Error('Invalid verification token');
        }

        // Check if token expired
        if (!device.verificationExpiresAt || device.verificationExpiresAt < new Date()) {
            throw new Error('Verification token has expired');
        }

        // Mark device as verified
        device.isVerified = true;
        device.verificationToken = null;
        device.verificationExpiresAt = null;
        await this.deviceRepository.save(device);

        logger.info('Device verified', {
            userId: userId.toString(),
            deviceId: device.id,
        });

        return {
            success: true,
            message: 'Device has been verified successfully.',
            deviceId: device.id,
        };
    }
}

