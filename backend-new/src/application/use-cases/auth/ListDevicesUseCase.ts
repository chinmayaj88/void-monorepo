import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { UserId } from '@domain/value-objects/UserId';

export interface ListDevicesInput {
    userId: string;
}

export interface DeviceInfo {
    id: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    isPrimary: boolean;
    isVerified: boolean;
    lastUsedAt: Date;
    createdAt: Date;
    ipAddress: string | null;
}

export interface ListDevicesOutput {
    devices: DeviceInfo[];
}

export class ListDevicesUseCase {
    constructor(private readonly deviceRepository: IDeviceRepository) {}

    async execute(input: ListDevicesInput): Promise<ListDevicesOutput> {
        const userId = UserId.fromString(input.userId);
        const devices = await this.deviceRepository.findByUserId(userId);

        const activeDevices = devices
            .filter((device) => !device.revokedAt)
            .map((device) => ({
                id: device.id,
                deviceName: device.deviceName,
                deviceType: device.deviceType,
                isPrimary: device.isPrimary,
                isVerified: device.isVerified,
                lastUsedAt: device.lastUsedAt,
                createdAt: device.createdAt,
                ipAddress: device.ipAddress,
            }));

        return {
            devices: activeDevices,
        };
    }
}


