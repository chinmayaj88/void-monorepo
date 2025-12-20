import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { ISessionRepository } from '@application/interfaces/ISessionRepository';
import { UserId } from '@domain/value-objects/UserId';
import {
  InvalidTotpCodeError,
  InvalidCredentialsError,
} from '@domain/errors/DomainError';
import { authenticator } from 'otplib';
import { TokenService } from '@infrastructure/encryption/TokenService';
import { createHash } from 'crypto';
import { logger } from '@infrastructure/config/Logger';

export interface VerifyTotpInput {
  refreshToken: string; // Use refreshToken from login instead of sessionToken
  totpCode: string;
  deviceId?: string;
}

export interface VerifyTotpOutput {
  userId: string;
  email: string;
  role: string;
  accessToken: string;
  refreshToken: string;
  deviceId?: string;
}

export class VerifyTotpUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly deviceRepository: IDeviceRepository,
    private readonly sessionRepository: ISessionRepository
  ) {}

  async execute(input: VerifyTotpInput): Promise<VerifyTotpOutput> {
    // Verify refresh token to get user info
    let payload;
    try {
      payload = TokenService.verifyRefreshToken(input.refreshToken);
    } catch {
      throw new InvalidCredentialsError();
    }

    const userId = UserId.fromString(payload.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    // Verify TOTP code
    const totpSecret = user.getTotpSecret();
    const isTotpValid = authenticator.verify({
      token: input.totpCode,
      secret: totpSecret,
    });

    if (!isTotpValid) {
      throw new InvalidTotpCodeError();
    }

    // Get or verify device
    let deviceId: string | null = null;
    if (input.deviceId) {
      const device = await this.deviceRepository.findById(input.deviceId);
      if (device && device.userId === userId.toString() && !device.revokedAt) {
        // Mark device as verified if it wasn't already
        if (!device.isVerified) {
          device.isVerified = true;
          device.verificationToken = null;
          device.verificationExpiresAt = null;
        }
        device.lastUsedAt = new Date();
        await this.deviceRepository.save(device);
        deviceId = device.id;
      }
    }

    // Find session by refresh token hash
    const refreshTokenHash = createHash('sha256').update(input.refreshToken).digest('hex');
    const session = await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);
    
    if (!session || session.revokedAt) {
      throw new InvalidCredentialsError();
    }

    // Generate new tokens with role
    const tokenPayload = {
      userId: user.getId().toString(),
      email: user.getEmail().toString(),
      role: user.getRole().toString(),
    };

    const accessToken = TokenService.generateAccessToken(tokenPayload);
    const newRefreshToken = TokenService.generateRefreshToken(tokenPayload);

    // Update session with new access token hash
    const accessTokenHash = createHash('sha256').update(accessToken).digest('hex');
    const newRefreshTokenHash = createHash('sha256').update(newRefreshToken).digest('hex');
    
    session.accessTokenHash = accessTokenHash;
    session.refreshTokenHash = newRefreshTokenHash;
    await this.sessionRepository.save(session);

    logger.info('TOTP verified successfully', {
      userId: user.getId().toString(),
      email: user.getEmail().toString(),
      deviceId,
    });

    // Log audit event
    const { auditLogger, AuditEventType } = await import('@infrastructure/database/AuditLogger');
    await auditLogger.log({
      userId: user.getId().toString(),
      eventType: AuditEventType.TOTP_VERIFIED,
      description: 'User verified TOTP code',
      ipAddress: null,
      userAgent: null,
      metadata: { deviceId },
    });

    return {
      userId: user.getId().toString(),
      email: user.getEmail().toString(),
      role: user.getRole().toString(),
      accessToken,
      refreshToken: newRefreshToken,
      deviceId: deviceId || undefined,
    };
  }
}

