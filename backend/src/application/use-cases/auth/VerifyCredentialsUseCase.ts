import { Email } from '@domain/value-objects/Email';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';
import { SessionService } from '@infrastructure/encryption/SessionService';

export interface VerifyCredentialsInput {
  email: string;
  password: string;
}

export interface VerifyCredentialsOutput {
  sessionToken: string;
  expiresIn: number;
}

export class VerifyCredentialsUseCase {
  constructor(private readonly userRepository: IUserRepository) {}

  async execute(
    input: VerifyCredentialsInput
  ): Promise<VerifyCredentialsOutput> {
    let email: Email;
    try {
      email = Email.create(input.email);
    } catch {
      throw new InvalidCredentialsError();
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new InvalidCredentialsError();
    }

    const isPasswordValid = await PasswordHasher.verify(
      user.getPasswordHash(),
      input.password
    );

    if (!isPasswordValid) {
      throw new InvalidCredentialsError();
    }

    const sessionToken = SessionService.createSession(
      user.getId().toString(),
      user.getEmail().toString()
    );

    return {
      sessionToken,
      expiresIn: 180,
    };
  }
}
