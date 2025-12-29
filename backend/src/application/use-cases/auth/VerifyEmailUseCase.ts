import { IUserRepository } from '@application/interfaces/IUserRepository';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export interface VerifyEmailInput {
    token: string;
}

export interface VerifyEmailOutput {
    success: boolean;
    message: string;
    email: string;
}

export class VerifyEmailUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(input: VerifyEmailInput): Promise<VerifyEmailOutput> {
        // Find user by verification token
        const user = await this.userRepository.findByEmailVerificationToken(input.token);
        if (!user) {
            throw new InvalidCredentialsError();
        }

        // Mark email as verified
        await this.userRepository.markEmailAsVerified(user.getId());

        logger.info('Email verified', {
            userId: user.getId().toString(),
            email: user.getEmail().toString(),
        });

        return {
            success: true,
            message: 'Email has been verified successfully.',
            email: user.getEmail().toString(),
        };
    }
}

