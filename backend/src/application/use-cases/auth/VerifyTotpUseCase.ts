import { IUserRepository } from '@application/interfaces/IUserRepository';
import { UserId } from '@domain/value-objects/UserId';
import {
  InvalidTotpCodeError,
  InvalidCredentialsError,
} from '@domain/errors/DomainError';
import { authenticator } from 'otplib';
import { SessionService } from '@infrastructure/encryption/SessionService';
import { TokenService } from '@infrastructure/encryption/TokenService';

export interface VerifyTotpInput {
  sessionToken: string;
  totpCode: string;
}

export interface VerifyTotpOutput {
  userId: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export class VerifyTotpUseCase {
  constructor(private readonly userRepository: IUserRepository) { }

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

    const totpSecret = user.getTotpSecret();
    const isTotpValid = authenticator.verify({
      token: input.totpCode,
      secret: totpSecret,
    });

    if (!isTotpValid) {
      throw new InvalidTotpCodeError();
    }

    SessionService.deleteSession(input.sessionToken);

    const tokenPayload = {
      userId: user.getId().toString(),
      email: user.getEmail().toString(),
    };

    return {
      userId: tokenPayload.userId,
      email: tokenPayload.email,
      accessToken: TokenService.generateAccessToken(tokenPayload),
      refreshToken: TokenService.generateRefreshToken(tokenPayload),
    };
  }
}

