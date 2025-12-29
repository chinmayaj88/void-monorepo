import { IUserRepository } from '@application/interfaces/IUserRepository';
import { ISessionRepository } from '@application/interfaces/ISessionRepository';
import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export interface ResetPasswordInput {
    token: string;
    newPassword: string;
}

export interface ResetPasswordOutput {
    success: boolean;
    message: string;
}

export class ResetPasswordUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly sessionRepository: ISessionRepository
    ) {}

    async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
        // Find user by reset token
        const user = await this.userRepository.findByPasswordResetToken(input.token);
        if (!user) {
            throw new InvalidCredentialsError();
        }

        // Check if token is expired
        const resetExpiresAt = user.getPasswordResetExpiresAt();
        if (!resetExpiresAt || resetExpiresAt < new Date()) {
            throw new InvalidCredentialsError();
        }

        // Hash new password
        const newPasswordHash = await PasswordHasher.hash(input.newPassword);

        // Update password
        user.updatePassword(newPasswordHash);

        // Clear reset token
        user.clearPasswordResetToken();

        // Save user
        await this.userRepository.save(user);

        // Revoke all existing sessions (force re-login)
        await this.sessionRepository.revokeAllUserSessions(user.getId());

        logger.info('Password reset successful', {
            userId: user.getId().toString(),
            email: user.getEmail().toString(),
        });

        return {
            success: true,
            message: 'Password has been reset successfully. Please login with your new password.',
        };
    }
}

