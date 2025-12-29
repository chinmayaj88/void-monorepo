import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { ISessionRepository } from '@application/interfaces/ISessionRepository';
import { UserId } from '@domain/value-objects/UserId';
import { ForbiddenError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export interface RevokeDeviceInput {
    userId: string;
    deviceId: string;
}

export interface RevokeDeviceOutput {
    success: boolean;
    message: string;
}

export class RevokeDeviceUseCase {
    constructor(
        private readonly deviceRepository: IDeviceRepository,
        private readonly sessionRepository: ISessionRepository
    ) {}

    async execute(input: RevokeDeviceInput): Promise<RevokeDeviceOutput> {
        const userId = UserId.fromString(input.userId);
        const device = await this.deviceRepository.findById(input.deviceId);

        if (!device) {
            throw new Error('Device not found');
        }

        // Verify user owns the device
        if (device.userId !== userId.toString()) {
            throw new ForbiddenError('You can only revoke your own devices');
        }

        // Revoke device
        await this.deviceRepository.revokeDevice(input.deviceId);

        // Revoke all sessions for this device
        await this.sessionRepository.revokeDeviceSessions(input.deviceId);

        logger.info('Device revoked', {
            deviceId: input.deviceId,
            userId: userId.toString(),
        });

        return {
            success: true,
            message: 'Device has been revoked successfully. All sessions for this device have been terminated.',
        };
    }
}


