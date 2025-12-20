import { UserId } from '@domain/value-objects/UserId';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { DeviceFingerprintService, DeviceInfo } from '@infrastructure/security/DeviceFingerprintService';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@infrastructure/config/Logger';

export interface SetupPrimaryDeviceInput {
    userId: string;
    deviceInfo: DeviceInfo;
}

export interface SetupPrimaryDeviceOutput {
    deviceId: string;
    verificationToken: string;
    message: string;
}

export class SetupPrimaryDeviceUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly deviceRepository: IDeviceRepository
    ) {}

    async execute(input: SetupPrimaryDeviceInput): Promise<SetupPrimaryDeviceOutput> {
        const userId = UserId.fromString(input.userId);

        // Check if user exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if user already has a primary device
        const existingPrimary = await this.deviceRepository.findPrimaryDevice(userId);
        if (existingPrimary) {
            throw new Error('User already has a primary device. Revoke the existing one first.');
        }

        // Generate device fingerprint
        const fingerprint = DeviceFingerprintService.createDeviceFingerprint(input.deviceInfo);

        // Check if device already exists
        const existingDevice = await this.deviceRepository.findByFingerprint(userId, fingerprint.fingerprint);
        if (existingDevice) {
            throw new Error('This device already exists. Use verify device instead.');
        }

        // Generate verification token
        const verificationToken = randomBytes(32).toString('hex');
        const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create device
        const deviceId = uuidv4();
        const device = {
            id: deviceId,
            userId: userId.toString(),
            deviceFingerprint: fingerprint.fingerprint,
            deviceName: fingerprint.deviceName,
            deviceType: fingerprint.deviceType,
            userAgent: input.deviceInfo.userAgent,
            ipAddress: input.deviceInfo.ipAddress,
            isPrimary: true, // This will be the primary device
            isVerified: false, // Needs verification
            verificationToken,
            verificationExpiresAt,
            lastUsedAt: new Date(),
            createdAt: new Date(),
            revokedAt: null,
        };

        await this.deviceRepository.save(device);

        logger.info('Primary device setup initiated', {
            userId: userId.toString(),
            deviceId,
        });

        return {
            deviceId,
            verificationToken,
            message: 'Primary device setup initiated. Please verify the device using the verification token sent to your email.',
        };
    }
}

