import { IUserRepository } from '@application/interfaces/IUserRepository';
import { Email } from '@domain/value-objects/Email';
import { IEmailService } from '@infrastructure/email/EmailService';
import { EmailTemplates } from '@infrastructure/email/EmailTemplates';
import { randomBytes } from 'crypto';
import { logger } from '@infrastructure/config/Logger';

export interface RequestPasswordResetInput {
    email: string;
}

export interface RequestPasswordResetOutput {
    success: boolean;
    message: string;
}

export class RequestPasswordResetUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly emailService: IEmailService
    ) {}

    async execute(input: RequestPasswordResetInput): Promise<RequestPasswordResetOutput> {
        let email: Email;
        try {
            email = Email.fromString(input.email);
        } catch {
            // Don't reveal if email exists or not
            return {
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            };
        }

        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            // Don't reveal if email exists or not
            return {
                success: true,
                message: 'If an account with that email exists, a password reset link has been sent.',
            };
        }

        // Generate reset token
        const resetToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await this.userRepository.updatePasswordResetToken(
            user.getId(),
            resetToken,
            expiresAt
        );

        // Send reset email
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
        const resetLink = `${baseUrl}/reset-password?token=${resetToken}`;

        const emailTemplate = EmailTemplates.passwordReset(
            user.getEmail().toString(),
            resetLink
        );

        try {
            await this.emailService.sendEmail({
                to: user.getEmail().toString(),
                subject: emailTemplate.subject,
                html: emailTemplate.html,
                text: emailTemplate.text,
            });

            logger.info('Password reset email sent', {
                userId: user.getId().toString(),
                email: user.getEmail().toString(),
            });
        } catch (error) {
            logger.error('Failed to send password reset email', {
                error: error instanceof Error ? error.message : error,
            });
            // Still return success to not reveal email existence
        }

        return {
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
        };
    }
}

