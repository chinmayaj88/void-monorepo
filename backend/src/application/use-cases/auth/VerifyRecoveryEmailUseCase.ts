import { IUserRepository } from '@application/interfaces/IUserRepository';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export interface VerifyRecoveryEmailInput {
    token: string;
}

export interface VerifyRecoveryEmailOutput {
    success: boolean;
    message: string;
}

export class VerifyRecoveryEmailUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(input: VerifyRecoveryEmailInput): Promise<VerifyRecoveryEmailOutput> {
        // Find user by recovery email verification token
        const user = await this.userRepository.findByRecoveryEmailVerificationToken(input.token);
        if (!user) {
            throw new InvalidCredentialsError();
        }

        // Mark recovery email as verified
        await this.userRepository.markRecoveryEmailAsVerified(user.getId());

        logger.info('Recovery email verified', {
            userId: user.getId().toString(),
        });

        return {
            success: true,
            message: 'Recovery email has been verified successfully.',
        };
    }
}

