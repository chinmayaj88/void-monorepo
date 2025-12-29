import { Email } from '@domain/value-objects/Email';
import { UserId } from '@domain/value-objects/UserId';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { ISessionRepository } from '@application/interfaces/ISessionRepository';
import { IIpWhitelistRepository } from '@application/interfaces/IIpWhitelistRepository';
import { DeviceFingerprintService, DeviceInfo } from '@infrastructure/security/DeviceFingerprintService';
import { SuspiciousActivityDetector } from '@infrastructure/security/SuspiciousActivityDetector';
import { IEmailService } from '@infrastructure/email/EmailService';
import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';
import { TokenService } from '@infrastructure/encryption/TokenService';
import { LoginAttemptTracker } from './LoginAttemptTracker';
import {
    InvalidCredentialsError,
    DeviceLimitExceededError,
} from '@domain/errors/DomainError';
import { randomBytes, createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@infrastructure/config/Logger';
import { auditLogger, AuditEventType } from '@infrastructure/database/AuditLogger';

export interface LoginInput {
    email: string;
    password: string;
    deviceInfo?: DeviceInfo;
    ipAddress?: string;
    userAgent?: string;
}

export interface LoginOutput {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    requiresDeviceVerification?: boolean;
    deviceId?: string;
    verificationToken?: string;
    message?: string;
}

export class LoginUseCase {
    private readonly maxDevices: number;
    private readonly attemptTracker: LoginAttemptTracker;

    private readonly suspiciousActivityDetector: SuspiciousActivityDetector;

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly deviceRepository: IDeviceRepository,
        private readonly sessionRepository: ISessionRepository,
        private readonly emailService: IEmailService,
        private readonly ipWhitelistRepository?: IIpWhitelistRepository
    ) {
        this.maxDevices = parseInt(process.env.MAX_DEVICES_PER_USER || '3', 10);
        this.attemptTracker = new LoginAttemptTracker(userRepository, emailService);
        this.suspiciousActivityDetector = new SuspiciousActivityDetector(emailService);
    }

    async execute(input: LoginInput): Promise<LoginOutput> {
        // Validate email
        let email: Email;
        try {
            email = Email.create(input.email);
        } catch {
            await this.attemptTracker.recordFailedAttempt(input.email, input.ipAddress);
            throw new InvalidCredentialsError();
        }

        // Find user
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            await this.attemptTracker.recordFailedAttempt(input.email, input.ipAddress);
            throw new InvalidCredentialsError();
        }

        // Check if email is verified (enforce email verification)
        if (!user.isEmailVerified()) {
            throw new Error('Please verify your email before logging in. Check your inbox for the verification link.');
        }

        // Check account lockout
        if (user.isAccountLocked()) {
            throw new Error(`Account is locked until ${user.getAccountLockedUntil()?.toISOString()}. Please try again later.`);
        }

        // Verify password
        const isPasswordValid = await PasswordHasher.verify(
            user.getPasswordHash(),
            input.password
        );

        if (!isPasswordValid) {
            await this.attemptTracker.handleFailedLogin(user.getId());
            await this.attemptTracker.recordFailedAttempt(input.email, input.ipAddress);
            throw new InvalidCredentialsError();
        }

        // Check email verification
        if (!user.isEmailVerified()) {
            throw new Error('Please verify your email before logging in.');
        }

        // Handle device management
        if (input.deviceInfo) {
            const fingerprint = DeviceFingerprintService.createDeviceFingerprint(input.deviceInfo);

            // Check existing device
            const existingDevice = await this.deviceRepository.findByFingerprint(
                user.getId(),
                fingerprint.fingerprint
            );

            if (existingDevice) {
                // Device exists
                if (existingDevice.revokedAt) {
                    throw new Error('This device has been revoked. Please contact support.');
                }

                if (!existingDevice.isVerified) {
                    // Device not verified - send verification email
                    const verificationToken = randomBytes(32).toString('hex');
                    const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

                    existingDevice.verificationToken = verificationToken;
                    existingDevice.verificationExpiresAt = verificationExpiresAt;
                    await this.deviceRepository.save(existingDevice);

                    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
                    const verificationLink = `${baseUrl}/api/auth/verify-device?token=${verificationToken}`;

                    await this.emailService.sendDeviceVerificationEmail(
                        user.getEmail().toString(),
                        user.getEmail().toString(),
                        existingDevice.deviceName,
                        verificationLink
                    );

                    // Generate tokens but require device verification
                    const tokens = this.generateTokens(user);
                    await this.createSession(user.getId(), tokens.refreshToken, existingDevice.id, input.ipAddress || null, input.userAgent || null);

                    return {
                        ...tokens,
                        requiresDeviceVerification: true,
                        deviceId: existingDevice.id,
                        verificationToken,
                        message: 'Device verification required. Please check your email.',
                    };
                }

                // Device is verified - update last used
                existingDevice.lastUsedAt = new Date();
                await this.deviceRepository.save(existingDevice);
            } else {
                // New device - check device limit
                const deviceCount = await this.deviceRepository.countDevices(user.getId());

                if (deviceCount >= this.maxDevices) {
                    throw new DeviceLimitExceededError(this.maxDevices);
                }

                // Check if user has primary device
                const primaryDevice = await this.deviceRepository.findPrimaryDevice(user.getId());
                if (!primaryDevice) {
                    throw new Error('Please set up a primary device first.');
                }

                // Create new device and require verification
                const deviceId = uuidv4();
                const verificationToken = randomBytes(32).toString('hex');
                const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

                const newDevice = {
                    id: deviceId,
                    userId: user.getId().toString(),
                    deviceFingerprint: fingerprint.fingerprint,
                    deviceName: fingerprint.deviceName,
                    deviceType: fingerprint.deviceType,
                    userAgent: input.deviceInfo.userAgent,
                    ipAddress: input.ipAddress || null,
                    isPrimary: false,
                    isVerified: false,
                    verificationToken,
                    verificationExpiresAt,
                    lastUsedAt: new Date(),
                    createdAt: new Date(),
                    revokedAt: null,
                };

                await this.deviceRepository.save(newDevice);

                // Send verification email
                const baseUrl = process.env.APP_URL || 'http://localhost:3000';
                const verificationLink = `${baseUrl}/api/auth/verify-device?token=${verificationToken}`;

                await this.emailService.sendDeviceVerificationEmail(
                    user.getEmail().toString(),
                    user.getEmail().toString(),
                    newDevice.deviceName,
                    verificationLink
                );

                // Generate tokens but require device verification
                const tokens = this.generateTokens(user);
                await this.createSession(user.getId(), tokens.refreshToken, deviceId, input.ipAddress || null, input.userAgent || null);

                return {
                    ...tokens,
                    requiresDeviceVerification: true,
                    deviceId,
                    verificationToken,
                    message: 'New device detected. Please verify it using the link sent to your email.',
                };
            }
        }

        // Check IP whitelist if enabled
        if (this.ipWhitelistRepository && input.ipAddress) {
            const isWhitelisted = await this.ipWhitelistRepository.isWhitelisted(user.getId(), input.ipAddress);
            if (!isWhitelisted && process.env.ENFORCE_IP_WHITELIST === 'true') {
                throw new Error('IP address not whitelisted. Please contact administrator.');
            }
        }

        // Check for suspicious activity
        if (input.ipAddress) {
            const suspiciousCheck = await this.suspiciousActivityDetector.checkSuspiciousActivity(
                user.getId(),
                input.ipAddress,
                user.getEmail().toString()
            );
            if (suspiciousCheck.isSuspicious) {
                logger.warn('Suspicious activity detected during login', {
                    userId: user.getId().toString(),
                    ipAddress: input.ipAddress,
                    reason: suspiciousCheck.reason,
                });
            }
        }

        // Successful login - reset failed attempts and update last login
        await this.attemptTracker.handleSuccessfulLogin(user.getId());
        await this.userRepository.updateLastLogin(user.getId());

        // Audit log
        await auditLogger.log({
            userId: user.getId().toString(),
            eventType: AuditEventType.LOGIN_SUCCESS,
            description: 'User logged in successfully',
            ipAddress: input.ipAddress || null,
            userAgent: input.userAgent || null,
        });

        // Generate tokens
        const tokens = this.generateTokens(user);
        const deviceId = input.deviceInfo
            ? (await this.deviceRepository.findByFingerprint(
                user.getId(),
                DeviceFingerprintService.createDeviceFingerprint(input.deviceInfo).fingerprint
            ))?.id || null
            : null;

        await this.createSession(user.getId(), tokens.refreshToken, deviceId, input.ipAddress || null, input.userAgent || null);

        logger.info('User logged in', {
            userId: user.getId().toString(),
            email: user.getEmail().toString(),
            deviceId,
        });

        return {
            ...tokens,
            message: 'Login successful',
        };
    }

    private generateTokens(user: any): { accessToken: string; refreshToken: string; expiresIn: number } {
        const payload = {
            userId: user.getId().toString(),
            email: user.getEmail().toString(),
            role: user.getRole().toString(),
        };

        const accessToken = TokenService.generateAccessToken(payload);
        const refreshToken = TokenService.generateRefreshToken(payload);

        // Parse expiry from env (default 15m = 900 seconds)
        const expiresIn = this.parseExpiry(process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m');

        return { accessToken, refreshToken, expiresIn };
    }

    private async createSession(
        userId: UserId,
        refreshToken: string,
        deviceId: string | null,
        ipAddress: string | null,
        userAgent: string | null
    ): Promise<void> {
        const sessionId = uuidv4();
        const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
        const accessTokenHash = null; // Will be set when access token is used

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days for refresh token

        await this.sessionRepository.save({
            id: sessionId,
            userId: userId.toString(),
            deviceId,
            refreshTokenHash,
            accessTokenHash,
            ipAddress,
            userAgent,
            createdAt: new Date(),
            expiresAt,
            revokedAt: null,
            lastActivityAt: new Date(),
        });
    }

    private parseExpiry(expiry: string): number {
        const match = expiry.match(/^(\d+)([smhd])$/);
        if (!match) return 900; // default 15 minutes

        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 60 * 60;
            case 'd': return value * 24 * 60 * 60;
            default: return 900;
        }
    }
}

