import { UserId } from '@domain/value-objects/UserId';
import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';

export interface ListDevicesInput {
    userId: string;
}

export interface DeviceInfo {
    deviceId: string;
    deviceName: string;
    deviceType: string;
    isPrimary: boolean;
    isVerified: boolean;
    lastUsedAt: Date;
    createdAt: Date;
    revokedAt: Date | null;
}

export interface ListDevicesOutput {
    devices: DeviceInfo[];
}

export class ListDevicesUseCase {
    constructor(private readonly deviceRepository: IDeviceRepository) {}

    async execute(input: ListDevicesInput): Promise<ListDevicesOutput> {
        const userId = UserId.fromString(input.userId);

        const devices = await this.deviceRepository.findByUserId(userId);

        return {
            devices: devices.map(device => ({
                deviceId: device.id,
                deviceName: device.deviceName,
                deviceType: device.deviceType,
                isPrimary: device.isPrimary,
                isVerified: device.isVerified,
                lastUsedAt: device.lastUsedAt,
                createdAt: device.createdAt,
                revokedAt: device.revokedAt,
            })),
        };
    }
}

