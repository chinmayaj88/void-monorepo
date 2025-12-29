import { IUserRepository } from '@application/interfaces/IUserRepository';
import { ISessionRepository } from '@application/interfaces/ISessionRepository';
import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { UserId } from '@domain/value-objects/UserId';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { TokenService } from '@infrastructure/encryption/TokenService';
import { TokenBlacklistService } from '@infrastructure/encryption/TokenBlacklistService';
import { createHash } from 'crypto';
import { logger } from '@infrastructure/config/Logger';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly sessionRepository: ISessionRepository,
    private readonly deviceRepository: IDeviceRepository
  ) { }

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    if (TokenBlacklistService.isBlacklisted(input.refreshToken)) {
      throw new InvalidCredentialsError();
    }

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

    // Check session in database
    const refreshTokenHash = createHash('sha256').update(input.refreshToken).digest('hex');
    const session = await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);
    
    if (!session) {
      throw new InvalidCredentialsError();
    }

    // Check if device is revoked
    if (session.deviceId) {
      const device = await this.deviceRepository.findById(session.deviceId);
      if (!device || device.revokedAt) {
        // Revoke session if device is revoked
        await this.sessionRepository.revokeSession(session.id);
        throw new InvalidCredentialsError();
      }
    }

    // Check if session is revoked
    if (session.revokedAt) {
      throw new InvalidCredentialsError();
    }

    const tokenPayload = {
      userId: user.getId().toString(),
      email: user.getEmail().toString(),
    };

    // Generate new tokens
    const newAccessToken = TokenService.generateAccessToken(tokenPayload);
    const newRefreshToken = TokenService.generateRefreshToken(tokenPayload);

    // Update session with new tokens
    const newAccessTokenHash = createHash('sha256').update(newAccessToken).digest('hex');
    const newRefreshTokenHash = createHash('sha256').update(newRefreshToken).digest('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    session.refreshTokenHash = newRefreshTokenHash;
    session.accessTokenHash = newAccessTokenHash;
    session.expiresAt = newExpiresAt;
    await this.sessionRepository.save(session);

    logger.info('Token refreshed', {
      userId: userId.toString(),
      sessionId: session.id,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }
}

