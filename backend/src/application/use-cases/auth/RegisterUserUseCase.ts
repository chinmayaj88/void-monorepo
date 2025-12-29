import { User } from '@domain/entities/User';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IEmailService } from '@infrastructure/email/EmailService';
import { EmailTemplates } from '@infrastructure/email/EmailTemplates';
import {
    EmailAlreadyExistsError,
    InvalidEmailError,
} from '@domain/errors/DomainError';
import { randomUUID, randomBytes } from 'crypto';
import { authenticator } from 'otplib';
import { logger } from '@infrastructure/config/Logger';

export interface RegisterUserInput {
    email: string;
    passwordHash: string;
}

export interface RegisterUserOutput {
    userId: string;
    email: string;
    totpSecret: string;
    qrCodeUrl: string;
    message: string;
}

export class RegisterUserUseCase {
    constructor(
        private readonly userRepository: IUserRepository,
        private readonly emailService: IEmailService
    ) { }

    async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
        let email: Email;
        try {
            email = Email.create(input.email);
        } catch {
            throw new InvalidEmailError(input.email);
        }

        const emailExists = await this.userRepository.existsByEmail(email);
        if (emailExists) {
            throw new EmailAlreadyExistsError(input.email);
        }

        const totpSecret = authenticator.generateSecret();

        const userId = UserId.create(randomUUID());
        const user = User.create(userId, email, input.passwordHash, totpSecret);

        await this.userRepository.save(user);

        // Generate email verification token
        const verificationToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await this.userRepository.updateEmailVerificationToken(userId, verificationToken, expiresAt);

        // Send verification email
        const emailTemplate = EmailTemplates.emailVerification(email.toString(), verificationToken);
        await this.emailService.sendEmail({
            to: email.toString(),
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
        });

        const serviceName = process.env.TOTP_ISSUER || 'Void Cloud Drive';
        const qrCodeUrl = authenticator.keyuri(
            email.toString(),
            serviceName,
            totpSecret
        );

        logger.info('User registered', {
            userId: userId.toString(),
            email: email.toString(),
        });

        return {
            userId: userId.toString(),
            email: email.toString(),
            totpSecret,
            qrCodeUrl,
            message: 'Registration successful. Please check your email to verify your account.',
        };
    }
}