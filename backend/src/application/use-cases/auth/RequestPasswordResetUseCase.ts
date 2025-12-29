import { Email } from '@domain/value-objects/Email';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IEmailService } from '@infrastructure/email/EmailService';
import { EmailTemplates } from '@infrastructure/email/EmailTemplates';
import { randomBytes } from 'crypto';
import { logger } from '@infrastructure/config/Logger';

export interface RequestPasswordResetInput {
    email: string;
}

export interface RequestPasswordResetOutput {
    message: string;
    // Don't return token for security - it's sent via email
}

export class RequestPasswordResetUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly emailService: IEmailService
    ) {}

    async execute(input: RequestPasswordResetInput): Promise<RequestPasswordResetOutput> {
        let email: Email;
        try {
            email = Email.create(input.email);
        } catch {
            // Don't reveal if email exists - security best practice
            return {
                message: 'If an account with that email exists, a password reset link has been sent.',
            };
        }

        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            // Don't reveal if email exists - security best practice
            return {
                message: 'If an account with that email exists, a password reset link has been sent.',
            };
        }

        // Generate reset token (cryptographically secure)
        const resetToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Save reset token
        await this.userRepository.updatePasswordResetToken(user.getId(), resetToken, expiresAt);

        // Send reset email
        const emailTemplate = EmailTemplates.passwordReset(email.toString(), resetToken);
        await this.emailService.sendEmail({
            to: email.toString(),
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
        });

        logger.info('Password reset requested', {
            userId: user.getId().toString(),
            email: email.toString(),
        });

        return {
            message: 'If an account with that email exists, a password reset link has been sent.',
        };
    }
}

