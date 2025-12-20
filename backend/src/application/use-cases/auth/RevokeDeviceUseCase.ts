import { UserId } from '@domain/value-objects/UserId';
import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { ISessionRepository } from '@application/interfaces/ISessionRepository';
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

        // Find device
        const device = await this.deviceRepository.findById(input.deviceId);
        if (!device) {
            throw new Error('Device not found');
        }

        // Verify ownership
        if (device.userId !== userId.toString()) {
            throw new Error('Device does not belong to user');
        }

        // Check if already revoked
        if (device.revokedAt) {
            return {
                success: true,
                message: 'Device is already revoked.',
            };
        }

        // Revoke device
        await this.deviceRepository.revokeDevice(input.deviceId);

        // Revoke all sessions for this device
        await this.sessionRepository.revokeDeviceSessions(input.deviceId);

        logger.info('Device revoked', {
            userId: userId.toString(),
            deviceId: input.deviceId,
        });

        return {
            success: true,
            message: 'Device has been revoked successfully. All sessions from this device have been terminated.',
        };
    }
}

