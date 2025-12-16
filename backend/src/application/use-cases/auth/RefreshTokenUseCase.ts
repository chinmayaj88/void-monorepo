import { IUserRepository } from '@application/interfaces/IUserRepository';
import { UserId } from '@domain/value-objects/UserId';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { TokenService } from '@infrastructure/encryption/TokenService';
import { TokenBlacklistService } from '@infrastructure/encryption/TokenBlacklistService';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(private readonly userRepository: IUserRepository) { }

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

    const tokenPayload = {
      userId: user.getId().toString(),
      email: user.getEmail().toString(),
    };

    return {
      accessToken: TokenService.generateAccessToken(tokenPayload),
      refreshToken: TokenService.generateRefreshToken(tokenPayload),
    };
  }
}

