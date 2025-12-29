import { UserId } from '@domain/value-objects/UserId';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export interface ChangePasswordInput {
    userId: string;
    currentPassword: string;
    newPassword: string;
}

export interface ChangePasswordOutput {
    success: boolean;
    message: string;
}

export class ChangePasswordUseCase {
    constructor(private readonly userRepository: IUserRepository) {}

    async execute(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
        const userId = UserId.fromString(input.userId);

        // Find user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new InvalidCredentialsError();
        }

        // Verify current password
        const isCurrentPasswordValid = await PasswordHasher.verify(
            user.getPasswordHash(),
            input.currentPassword
        );

        if (!isCurrentPasswordValid) {
            throw new InvalidCredentialsError();
        }

        // Validate new password
        if (input.newPassword.length < 8 || input.newPassword.length > 100) {
            throw new Error('Password must be between 8 and 100 characters');
        }

        // Check if new password is same as current
        const isSamePassword = await PasswordHasher.verify(
            user.getPasswordHash(),
            input.newPassword
        );

        if (isSamePassword) {
            throw new Error('New password must be different from current password');
        }

        // Hash new password
        const newPasswordHash = await PasswordHasher.hash(input.newPassword);

        // Update password
        user.updatePassword(newPasswordHash);
        await this.userRepository.save(user);

        logger.info('Password changed', {
            userId: userId.toString(),
        });

        return {
            success: true,
            message: 'Password has been changed successfully.',
        };
    }
}

