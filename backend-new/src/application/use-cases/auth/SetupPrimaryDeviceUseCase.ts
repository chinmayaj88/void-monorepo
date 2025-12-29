import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { UserId } from '@domain/value-objects/UserId';
import { ForbiddenError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export interface SetupPrimaryDeviceInput {
    userId: string;
    deviceId: string;
}

export interface SetupPrimaryDeviceOutput {
    success: boolean;
    message: string;
}

export class SetupPrimaryDeviceUseCase {
    constructor(private readonly deviceRepository: IDeviceRepository) {}

    async execute(input: SetupPrimaryDeviceInput): Promise<SetupPrimaryDeviceOutput> {
        const userId = UserId.fromString(input.userId);
        const device = await this.deviceRepository.findById(input.deviceId);

        if (!device) {
            throw new Error('Device not found');
        }

        // Verify user owns the device
        if (device.userId !== userId.toString()) {
            throw new ForbiddenError('You can only set your own devices as primary');
        }

        // Verify device is verified
        if (!device.isVerified) {
            throw new Error('Device must be verified before it can be set as primary');
        }

        // Unset current primary device if exists
        const currentPrimary = await this.deviceRepository.findPrimaryDevice(userId);
        if (currentPrimary && currentPrimary.id !== input.deviceId) {
            currentPrimary.isPrimary = false;
            await this.deviceRepository.save(currentPrimary);
        }

        // Set new primary device
        device.isPrimary = true;
        await this.deviceRepository.save(device);

        logger.info('Primary device set', {
            deviceId: input.deviceId,
            userId: userId.toString(),
        });

        return {
            success: true,
            message: 'Primary device has been set successfully.',
        };
    }
}


