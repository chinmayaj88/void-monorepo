import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IEmailService } from '@infrastructure/email/EmailService';
import { EmailTemplates } from '@infrastructure/email/EmailTemplates';
import { randomBytes } from 'crypto';
import { logger } from '@infrastructure/config/Logger';

export interface SetupRecoveryEmailInput {
    userId: string;
    recoveryEmail: string;
}

export interface SetupRecoveryEmailOutput {
    message: string;
}

export class SetupRecoveryEmailUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly emailService: IEmailService
    ) {}

    async execute(input: SetupRecoveryEmailInput): Promise<SetupRecoveryEmailOutput> {
        const userId = UserId.fromString(input.userId);

        // Check if user exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Validate recovery email
        let recoveryEmail: Email;
        try {
            recoveryEmail = Email.create(input.recoveryEmail);
        } catch {
            throw new Error('Invalid recovery email format');
        }

        // Check if recovery email is same as primary email
        if (recoveryEmail.equals(user.getEmail())) {
            throw new Error('Recovery email cannot be the same as your primary email');
        }

        // Check if recovery email is already used by another account
        const existingUser = await this.userRepository.findByEmail(recoveryEmail);
        if (existingUser && !existingUser.getId().equals(userId)) {
            throw new Error('Recovery email is already in use by another account');
        }

        // Generate verification token
        const verificationToken = randomBytes(32).toString('hex');

        // Save recovery email and token
        await this.userRepository.updateRecoveryEmail(userId, recoveryEmail.toString());
        await this.userRepository.updateRecoveryEmailVerificationToken(userId, verificationToken);

        // Send verification email
        const emailTemplate = EmailTemplates.recoveryEmailVerification(recoveryEmail.toString(), verificationToken);
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
            message: 'Recovery email has been set. Please verify it using the link sent to your recovery email.',
        };
    }
}

