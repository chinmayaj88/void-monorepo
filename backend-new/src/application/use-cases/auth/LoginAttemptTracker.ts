import { UserId } from '@domain/value-objects/UserId';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IEmailService } from '@infrastructure/email/EmailService';
import { EmailTemplates } from '@infrastructure/email/EmailTemplates';
import { logger } from '@infrastructure/config/Logger';
import { auditLogger, AuditEventType } from '@infrastructure/database/AuditLogger';

export class LoginAttemptTracker {
    private static readonly MAX_FAILED_ATTEMPTS = 5;
    private static readonly LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly emailService?: IEmailService
    ) {}

    async recordFailedAttempt(email: string, _ipAddress?: string): Promise<void> {
        try {
            const { Email } = await import('@domain/value-objects/Email');
            const user = await this.userRepository.findByEmail(Email.fromString(email));
            if (user) {
                await this.handleFailedLogin(user.getId());
            }
        } catch {
            // Email format invalid or user not found - ignore
        }
    }

    async checkAccountLockout(userId: UserId): Promise<{ isLocked: boolean; lockedUntil?: Date }> {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            return { isLocked: false };
        }

        if (user.isAccountLocked()) {
            return { isLocked: true, lockedUntil: user.getAccountLockedUntil() || undefined };
        }

        return { isLocked: false };
    }

    async handleFailedLogin(userId: UserId): Promise<void> {
        await this.userRepository.incrementFailedLoginAttempts(userId);

        const user = await this.userRepository.findById(userId);
        if (user && user.getFailedLoginAttempts() >= LoginAttemptTracker.MAX_FAILED_ATTEMPTS) {
            const lockedUntil = new Date(Date.now() + LoginAttemptTracker.LOCKOUT_DURATION_MS);
            await this.userRepository.lockAccount(userId, lockedUntil);

            // Send account lockout notification email
            if (this.emailService) {
                try {
                    const template = EmailTemplates.accountLocked(
                        user.getEmail().toString(),
                        lockedUntil.toLocaleString()
                    );
                    await this.emailService.sendEmail({
                        to: user.getEmail().toString(),
                        subject: template.subject,
                        html: template.html,
                        text: template.text,
                    });
                } catch (error) {
                    logger.error('Failed to send account lockout notification email', {
                        error: error instanceof Error ? error.message : error,
                    });
                }
            }

            // Audit log
            await auditLogger.log({
                userId: userId.toString(),
                eventType: AuditEventType.ACCOUNT_LOCKED,
                description: `Account locked due to ${LoginAttemptTracker.MAX_FAILED_ATTEMPTS} failed login attempts`,
                ipAddress: null,
                userAgent: null,
                metadata: { lockedUntil: lockedUntil.toISOString() },
            });
        }
    }

    async handleSuccessfulLogin(userId: UserId): Promise<void> {
        await this.userRepository.resetFailedLoginAttempts(userId);
        await this.userRepository.unlockAccount(userId);
        await this.userRepository.updateLastLogin(userId);
    }
}

