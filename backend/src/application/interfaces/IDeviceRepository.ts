import { UserId } from '@domain/value-objects/UserId';

export interface Device {
    id: string;
    userId: string;
    deviceFingerprint: string;
    deviceName: string;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
    userAgent: string | null;
    ipAddress: string | null;
    isPrimary: boolean;
    isVerified: boolean;
    verificationToken: string | null;
    verificationExpiresAt: Date | null;
    lastUsedAt: Date;
    createdAt: Date;
    revokedAt: Date | null;
}

export interface IDeviceRepository {
    save(device: Device): Promise<void>;
    findById(deviceId: string): Promise<Device | null>;
    findByUserId(userId: UserId): Promise<Device[]>;
    findByFingerprint(userId: UserId, fingerprint: string): Promise<Device | null>;
    findPrimaryDevice(userId: UserId): Promise<Device | null>;
    findVerifiedDevices(userId: UserId): Promise<Device[]>;
    revokeDevice(deviceId: string): Promise<void>;
    revokeAllDevices(userId: UserId, exceptDeviceId?: string): Promise<void>;
    delete(deviceId: string): Promise<void>;
}

