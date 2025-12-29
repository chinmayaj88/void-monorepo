import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { ISessionRepository } from '@application/interfaces/ISessionRepository';
import { UserId } from '@domain/value-objects/UserId';
import {
  InvalidTotpCodeError,
  InvalidCredentialsError,
} from '@domain/errors/DomainError';
import { authenticator } from 'otplib';
import { SessionService } from '@infrastructure/encryption/SessionService';
import { TokenService } from '@infrastructure/encryption/TokenService';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@infrastructure/config/Logger';

export interface VerifyTotpInput {
  sessionToken: string;
  totpCode: string;
  deviceId?: string; // Optional device ID if device was created during login
}

export interface VerifyTotpOutput {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
  deviceId?: string;
}

export class VerifyTotpUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly deviceRepository: IDeviceRepository,
    private readonly sessionRepository: ISessionRepository
  ) { }

  async execute(input: VerifyTotpInput): Promise<VerifyTotpOutput> {
    const session = SessionService.getSession(input.sessionToken);
    if (!session) {
      throw new InvalidCredentialsError();
    }

    const userId = UserId.fromString(session.userId);
    const user = await this.userRepository.findById(userId);
    if (!user) {
      SessionService.deleteSession(input.sessionToken);
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

    // Delete session token
    SessionService.deleteSession(input.sessionToken);

    // Get or verify device
    let deviceId: string | null = null;
    if (input.deviceId) {
      const device = await this.deviceRepository.findById(input.deviceId);
      if (device && device.userId === userId.toString() && !device.revokedAt) {
        // Update device last used
        device.lastUsedAt = new Date();
        await this.deviceRepository.save(device);
        deviceId = device.id;
      }
    }

    const tokenPayload = {
      userId: user.getId().toString(),
      email: user.getEmail().toString(),
    };

    // Generate tokens
    const accessToken = TokenService.generateAccessToken(tokenPayload);
    const refreshToken = TokenService.generateRefreshToken(tokenPayload);

    // Create session in database
    const sessionId = uuidv4();
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');
    const accessTokenHash = createHash('sha256').update(accessToken).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.sessionRepository.save({
      id: sessionId,
      userId: userId.toString(),
      deviceId,
      refreshTokenHash,
      accessTokenHash,
      ipAddress: null, // Can be extracted from request if needed
      userAgent: null, // Can be extracted from request if needed
      createdAt: new Date(),
      expiresAt,
      revokedAt: null,
    });

    logger.info('TOTP verified and session created', {
      userId: userId.toString(),
      deviceId,
    });

    return {
      userId: tokenPayload.userId,
      email: tokenPayload.email,
      accessToken,
      refreshToken,
      deviceId: deviceId || undefined,
    };
  }
}

