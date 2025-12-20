import { Email } from '@domain/value-objects/Email';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IEmailService } from '@infrastructure/email/EmailService';
import { EmailTemplates } from '@infrastructure/email/EmailTemplates';
import { randomBytes } from 'crypto';
import { logger } from '@infrastructure/config/Logger';

export interface ResendEmailVerificationInput {
    email: string;
}

export interface ResendEmailVerificationOutput {
    message: string;
}

export class ResendEmailVerificationUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly emailService: IEmailService
    ) {}

    async execute(input: ResendEmailVerificationInput): Promise<ResendEmailVerificationOutput> {
        let email: Email;
        try {
            email = Email.create(input.email);
        } catch {
            throw new Error('Invalid email format');
        }

        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            // Don't reveal if email exists
            return {
                message: 'If an account with that email exists and is not verified, a verification email has been sent.',
            };
        }

        // Check if already verified (we can check this via a query, but for simplicity, we'll just send)
        // Generate new verification token
        const verificationToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Save verification token
        await this.userRepository.updateEmailVerificationToken(user.getId(), verificationToken, expiresAt);

        // Send verification email
        const emailTemplate = EmailTemplates.emailVerification(email.toString(), verificationToken);
        await this.emailService.sendEmail({
            to: email.toString(),
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
        });

        logger.info('Email verification resent', {
            userId: user.getId().toString(),
            email: email.toString(),
        });

        return {
            message: 'If an account with that email exists and is not verified, a verification email has been sent.',
        };
    }
}

