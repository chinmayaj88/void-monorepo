import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IEmailService } from '@infrastructure/email/EmailService';
import { Email } from '@domain/value-objects/Email';
import { UserId } from '@domain/value-objects/UserId';
import { EmailTemplates } from '@infrastructure/email/EmailTemplates';
import { randomBytes } from 'crypto';
import { logger } from '@infrastructure/config/Logger';

export interface SetupRecoveryEmailInput {
    userId: string;
    email: string;
}

export interface SetupRecoveryEmailOutput {
    success: boolean;
    message: string;
}

export class SetupRecoveryEmailUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly emailService: IEmailService
    ) {}

    async execute(input: SetupRecoveryEmailInput): Promise<SetupRecoveryEmailOutput> {
        const userId = UserId.fromString(input.userId);
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const recoveryEmail = Email.fromString(input.email);

        // Check if recovery email is same as primary email
        if (recoveryEmail.equals(user.getEmail())) {
            throw new Error('Recovery email cannot be the same as your primary email');
        }

        // Generate verification token
        const verificationToken = randomBytes(32).toString('hex');

        // Update recovery email (use repository method directly since it takes string)
        await this.userRepository.updateRecoveryEmail(userId, recoveryEmail.toString());
        await this.userRepository.updateRecoveryEmailVerificationToken(userId, verificationToken);

        // Send verification email
        const baseUrl = process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:3000';
        const verificationLink = `${baseUrl}/verify-recovery-email?token=${verificationToken}`;

        const emailTemplate = EmailTemplates.recoveryEmailVerification(
            recoveryEmail.toString(),
            verificationLink
        );

        await this.emailService.sendEmail({
            to: recoveryEmail.toString(),
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
        });

        logger.info('Recovery email setup initiated', {
            userId: userId.toString(),
            recoveryEmail: recoveryEmail.toString(),
        });

        return {
            success: true,
            message: 'Recovery email verification link has been sent. Please check your email.',
        };
    }
}

