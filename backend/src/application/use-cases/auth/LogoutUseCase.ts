import { TokenService } from '@infrastructure/encryption/TokenService';
import { TokenBlacklistService } from '@infrastructure/encryption/TokenBlacklistService';
import jwt from 'jsonwebtoken';

export interface LogoutInput {
  refreshToken: string;
}

export interface LogoutOutput {
  success: boolean;
  message: string;
}

export class LogoutUseCase {
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

