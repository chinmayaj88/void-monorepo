import { IUserRepository } from '@application/interfaces/IUserRepository';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export interface VerifyEmailInput {
    token: string;
}

export interface VerifyEmailOutput {
    success: boolean;
    message: string;
}

export class VerifyEmailUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
        const user = await this.userRepository.findByEmailVerificationToken(input.token);
        if (!user) {
            throw new InvalidCredentialsError();
        }

        // Check if token is expired
        const expiresAt = user.getEmailVerificationExpiresAt();
        if (!expiresAt || expiresAt < new Date()) {
            throw new InvalidCredentialsError();
        }

        // Mark email as verified
        user.markEmailAsVerified();
        await this.userRepository.save(user);

        logger.info('Email verified', {
            userId: user.getId().toString(),
            email: user.getEmail().toString(),
        });

        return {
            success: true,
            message: 'Email has been verified successfully.',
        };
    }
}


