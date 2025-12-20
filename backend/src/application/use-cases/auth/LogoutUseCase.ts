import { TokenService } from '@infrastructure/encryption/TokenService';
import { TokenBlacklistService } from '@infrastructure/encryption/TokenBlacklistService';
import { ISessionRepository } from '@application/interfaces/ISessionRepository';
import { createHash } from 'crypto';
import jwt from 'jsonwebtoken';
import { logger } from '@infrastructure/config/Logger';

export interface LogoutInput {
  refreshToken: string;
}

export interface LogoutOutput {
  success: boolean;
  message: string;
}

export class LogoutUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    let decoded;
    try {
      decoded = jwt.decode(input.refreshToken) as jwt.JwtPayload | null;
      if (!decoded) {
        return {
          success: true,
          message: 'Logged out successfully',
        };
      }
      TokenService.verifyRefreshToken(input.refreshToken);
    } catch {
      return {
        success: true,
        message: 'Logged out successfully',
      };
    }

    // Revoke session in database
    const refreshTokenHash = createHash('sha256').update(input.refreshToken).digest('hex');
    const session = await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);
    if (session) {
      await this.sessionRepository.revokeSession(session.id);
      logger.info('Session revoked on logout', {
        sessionId: session.id,
        userId: session.userId,
      });
    }

    // Add to blacklist
    const expiresAt = decoded.exp
      ? decoded.exp * 1000
      : Date.now() + 7 * 24 * 60 * 60 * 1000; 

    TokenBlacklistService.add(input.refreshToken, expiresAt);

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }
}

