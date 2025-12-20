import { IUserRepository } from '@application/interfaces/IUserRepository';
import { ISessionRepository } from '@application/interfaces/ISessionRepository';
import { IPasswordHistoryRepository } from '@application/interfaces/IPasswordHistoryRepository';
import { IEmailService } from '@infrastructure/email/EmailService';
import { UserId } from '@domain/value-objects/UserId';
import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';
import { auditLogger, AuditEventType } from '@infrastructure/database/AuditLogger';

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
    private readonly PASSWORD_HISTORY_LIMIT = 5;

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly sessionRepository: ISessionRepository,
        private readonly passwordHistoryRepository: IPasswordHistoryRepository,
        private readonly emailService: IEmailService
    ) { }

    async execute(input: ChangePasswordInput): Promise<ChangePasswordOutput> {
        const userId = UserId.fromString(input.userId);
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new InvalidCredentialsError();
        }

        const isCurrentPasswordValid = await PasswordHasher.verify(
            user.getPasswordHash(),
            input.currentPassword
        );

        if (!isCurrentPasswordValid) {
            throw new InvalidCredentialsError();
        }

        const isSamePassword = await PasswordHasher.verify(
            user.getPasswordHash(),
            input.newPassword
        );

        if (isSamePassword) {
            throw new Error('New password must be different from current password');
        }

        // Check password history - prevent reuse of last 5 passwords
        const recentPasswords = await this.passwordHistoryRepository.getRecentPasswords(userId, this.PASSWORD_HISTORY_LIMIT);
        for (const oldPasswordHash of recentPasswords) {
            const isReused = await PasswordHasher.verify(oldPasswordHash, input.newPassword);
            if (isReused) {
                throw new Error(`You cannot reuse any of your last ${this.PASSWORD_HISTORY_LIMIT} passwords`);
            }
        }

        // Save current password to history before changing
        await this.passwordHistoryRepository.save(userId, user.getPasswordHash());

        const newPasswordHash = await PasswordHasher.hash(input.newPassword);
        user.updatePassword(newPasswordHash);
        await this.userRepository.save(user);

        // Clean up old password history (keep only last 5)
        await this.passwordHistoryRepository.clearOldPasswords(userId, this.PASSWORD_HISTORY_LIMIT);

        await this.sessionRepository.revokeAllUserSessions(userId);

        // Send security notification email
        try {
            const emailTemplate = await import('@infrastructure/email/EmailTemplates');
            const template = emailTemplate.EmailTemplates.passwordChanged(
                user.getEmail().toString(),
                new Date().toLocaleString()
            );
            await this.emailService.sendEmail({
                to: user.getEmail().toString(),
                subject: template.subject,
                html: template.html,
                text: template.text,
            });
        } catch (error) {
            logger.error('Failed to send password change notification email', {
                error: error instanceof Error ? error.message : error,
            });
        }

        // Audit log
        await auditLogger.log({
            userId: userId.toString(),
            eventType: AuditEventType.PASSWORD_CHANGED,
            description: 'User changed password',
            ipAddress: null,
            userAgent: null,
        });

        logger.info('Password changed', {
            userId: user.getId().toString(),
            email: user.getEmail().toString(),
        });

        return {
            success: true,
            message: 'Password has been changed successfully. Please login again.',
        };
    }
}


