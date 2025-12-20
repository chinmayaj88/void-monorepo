import { IUserRepository } from '@application/interfaces/IUserRepository';
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
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
        // Find user by reset token
        const user = await this.userRepository.findByPasswordResetToken(input.token);
        if (!user) {
            throw new InvalidCredentialsError();
        }

        // Validate new password
        if (input.newPassword.length < 8 || input.newPassword.length > 100) {
            throw new Error('Password must be between 8 and 100 characters');
        }

        // Hash new password
        const newPasswordHash = await PasswordHasher.hash(input.newPassword);

        // Update password and clear reset token
        user.updatePassword(newPasswordHash);
        await this.userRepository.save(user);
        await this.userRepository.updatePasswordResetToken(user.getId(), null, null);

        // Reset failed login attempts (user might have been locked out)
        await this.userRepository.resetFailedLoginAttempts(user.getId());
        await this.userRepository.unlockAccount(user.getId());

        logger.info('Password reset successful', {
            userId: user.getId().toString(),
        });

        return {
            success: true,
            message: 'Password has been reset successfully. You can now login with your new password.',
        };
    }
}

