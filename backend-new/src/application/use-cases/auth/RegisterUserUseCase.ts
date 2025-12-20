import { User } from '@domain/entities/User';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { Role } from '@domain/value-objects/Role';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IEmailService } from '@infrastructure/email/EmailService';
import {
    EmailAlreadyExistsError,
    InvalidEmailError,
    ForbiddenError,
} from '@domain/errors/DomainError';
import { randomUUID, randomBytes } from 'crypto';
import { authenticator } from 'otplib';
import { logger } from '@infrastructure/config/Logger';

export interface RegisterUserInput {
    email: string;
    password: string;
    adminUserId: string; // The admin user ID who is registering this user
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
    ) {}

    async execute(input: RegisterUserInput): Promise<RegisterUserOutput> {
        // Verify admin user exists and is admin
        const adminId = UserId.fromString(input.adminUserId);
        const admin = await this.userRepository.findById(adminId);
        
        if (!admin) {
            throw new ForbiddenError('Admin user not found');
        }

        if (!admin.isAdmin()) {
            throw new ForbiddenError('Only admins can register new users');
        }

        // Validate and create email
        let email: Email;
        try {
            email = Email.create(input.email);
        } catch {
            throw new InvalidEmailError(input.email);
        }

        // Check if email already exists
        const emailExists = await this.userRepository.existsByEmail(email);
        if (emailExists) {
            throw new EmailAlreadyExistsError(input.email);
        }

        // Hash password
        const { PasswordHasher } = await import('@infrastructure/encryption/PasswordHasher');
        const passwordHash = await PasswordHasher.hash(input.password);

        // Generate TOTP secret
        const totpSecret = authenticator.generateSecret();

        // Create user with 'user' role (only admin can register, but registered users are 'user' role)
        const userId = UserId.create(randomUUID());
        const user = User.create(userId, email, passwordHash, totpSecret, Role.user());

        await this.userRepository.save(user);

        // Generate email verification token
        const verificationToken = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        await this.userRepository.updateEmailVerificationToken(userId, verificationToken, expiresAt);

        // Send verification email
        const baseUrl = process.env.APP_URL || 'http://localhost:3000';
        const verificationLink = `${baseUrl}/api/auth/verify-email?token=${verificationToken}`;
        await this.emailService.sendVerificationEmail(
            email.toString(),
            email.toString(),
            verificationLink
        );

        // Generate QR code URL for TOTP
        const serviceName = process.env.TOTP_ISSUER || 'Void Cloud Drive';
        const qrCodeUrl = authenticator.keyuri(
            email.toString(),
            serviceName,
            totpSecret
        );

        logger.info('User registered by admin', {
            userId: userId.toString(),
            email: email.toString(),
            registeredBy: input.adminUserId,
        });

        return {
            userId: userId.toString(),
            email: email.toString(),
            totpSecret,
            qrCodeUrl,
            message: 'User registered successfully. Verification email sent.',
        };
    }
}

