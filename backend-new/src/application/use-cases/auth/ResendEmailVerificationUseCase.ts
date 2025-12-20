import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IEmailService } from '@infrastructure/email/EmailService';
import { Email } from '@domain/value-objects/Email';
import { UserId } from '@domain/value-objects/UserId';
import { UserNotFoundError } from '@domain/errors/DomainError';
import { EmailTemplates } from '@infrastructure/email/EmailTemplates';
import { randomBytes } from 'crypto';
import { logger } from '@infrastructure/config/Logger';

export interface ResendEmailVerificationInput {
    email?: string;
    userId?: string;
}

export interface ResendEmailVerificationOutput {
    success: boolean;
    message: string;
}

export class ResendEmailVerificationUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly emailService: IEmailService
    ) {}

    async execute(input: ResendEmailVerificationInput): Promise<ResendEmailVerificationOutput> {
        let user;

        if (input.userId) {
            user = await this.userRepository.findById(UserId.fromString(input.userId));
        } else if (input.email) {
            const email = Email.fromString(input.email);
            user = await this.userRepository.findByEmail(email);
        } else {
            throw new Error('Either email or userId must be provided');
        }

        if (!user) {
            throw new UserNotFoundError(input.userId || input.email || 'unknown');
        }

        if (user.isEmailVerified()) {
            return {
                success: true,
                message: 'Email is already verified.',
            };
        }

        // Generate new verification token
        const verificationToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await this.userRepository.updateEmailVerificationToken(
            user.getId(),
            verificationToken,
            expiresAt
        );

        // Send verification email
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
        const verificationLink = `${baseUrl}/verify-email?token=${verificationToken}`;

        const emailTemplate = EmailTemplates.emailVerification(
            user.getEmail().toString(),
            verificationLink
        );

        await this.emailService.sendEmail({
            to: user.getEmail().toString(),
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
        });

        logger.info('Email verification resent', {
            userId: user.getId().toString(),
            email: user.getEmail().toString(),
        });

        return {
            success: true,
            message: 'Verification email has been sent. Please check your inbox.',
        };
    }
}

