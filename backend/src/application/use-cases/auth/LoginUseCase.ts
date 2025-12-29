import { Email } from '@domain/value-objects/Email';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { DeviceFingerprintService, DeviceInfo } from '@infrastructure/security/DeviceFingerprintService';
import { IEmailService } from '@infrastructure/email/EmailService';
import { EmailTemplates } from '@infrastructure/email/EmailTemplates';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';
import { SessionService } from '@infrastructure/encryption/SessionService';
import { LoginAttemptTracker } from './LoginAttemptTracker';
import { DatabaseConnection } from '@infrastructure/database/DatabaseConnection';
import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export interface LoginInput {
  email: string;
  password: string;
  deviceInfo?: DeviceInfo;
  ipAddress?: string;
}

export interface LoginOutput {
  sessionToken: string;
  expiresIn: number;
  requiresDeviceVerification?: boolean;
  deviceId?: string;
  verificationToken?: string;
  message?: string;
}

export class LoginUseCase {
  private readonly attemptTracker: LoginAttemptTracker;

  constructor(
    private readonly userRepository: IUserRepository,
    private readonly deviceRepository: IDeviceRepository,
    private readonly emailService: IEmailService
  ) {
    this.attemptTracker = new LoginAttemptTracker(userRepository, DatabaseConnection.getPool());
  }

  async execute(input: LoginInput): Promise<LoginOutput> {
    let email: Email;
    try {
      email = Email.create(input.email);
    } catch {
      await this.attemptTracker.recordAttempt({
        userId: null,
        email: input.email,
        ipAddress: input.ipAddress || 'unknown',
        success: false,
        failureReason: 'Invalid email format',
      });
      throw new InvalidCredentialsError();
    }

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.attemptTracker.recordAttempt({
        userId: null,
        email: input.email,
        ipAddress: input.ipAddress || 'unknown',
        success: false,
        failureReason: 'User not found',
      });
      throw new InvalidCredentialsError();
    }

    // Check account lockout
    const lockoutStatus = await this.attemptTracker.checkAccountLockout(user.getId());
    if (lockoutStatus.isLocked) {
      throw new Error(`Account is locked until ${lockoutStatus.lockedUntil?.toISOString()}. Please try again later.`);
    }

    const isPasswordValid = await PasswordHasher.verify(
      user.getPasswordHash(),
      input.password
    );

    if (!isPasswordValid) {
      await this.attemptTracker.handleFailedLogin(user.getId());
      await this.attemptTracker.recordAttempt({
        userId: user.getId().toString(),
        email: input.email,
        ipAddress: input.ipAddress || 'unknown',
        success: false,
        failureReason: 'Invalid password',
      });
      throw new InvalidCredentialsError();
    }

    // Password is valid - handle successful login
    await this.attemptTracker.handleSuccessfulLogin(user.getId());
    await this.attemptTracker.recordAttempt({
      userId: user.getId().toString(),
      email: input.email,
      ipAddress: input.ipAddress || 'unknown',
      success: true,
    });

    // Device management: Check if device info provided
    if (input.deviceInfo) {
      const fingerprint = DeviceFingerprintService.createDeviceFingerprint(input.deviceInfo);
      
      // Check if device exists
      const existingDevice = await this.deviceRepository.findByFingerprint(user.getId(), fingerprint.fingerprint);
      
      if (existingDevice) {
        // Device exists - check if verified
        if (!existingDevice.isVerified) {
          // Device not verified - need verification
          const verificationToken = randomBytes(32).toString('hex');
          const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
          
          existingDevice.verificationToken = verificationToken;
          existingDevice.verificationExpiresAt = verificationExpiresAt;
          await this.deviceRepository.save(existingDevice);

          // Send verification email
          const emailTemplate = EmailTemplates.newDeviceLogin(
            user.getEmail().toString(),
            existingDevice.deviceName,
            input.ipAddress || 'unknown',
            verificationToken
          );
          await this.emailService.sendEmail({
            to: user.getEmail().toString(),
            subject: emailTemplate.subject,
            html: emailTemplate.html,
            text: emailTemplate.text,
          });

          return {
            sessionToken: SessionService.createSession(user.getId().toString(), user.getEmail().toString()),
            expiresIn: 180,
            requiresDeviceVerification: true,
            deviceId: existingDevice.id,
            verificationToken,
            message: 'Device verification required. Please check your email.',
          };
        }

        // Device is verified - update last used
        existingDevice.lastUsedAt = new Date();
        await this.deviceRepository.save(existingDevice);
      } else {
        // New device - check if user has primary device
        const primaryDevice = await this.deviceRepository.findPrimaryDevice(user.getId());
        
        if (!primaryDevice) {
          // No primary device - user needs to set one up first
          return {
            sessionToken: SessionService.createSession(user.getId().toString(), user.getEmail().toString()),
            expiresIn: 180,
            requiresDeviceVerification: false,
            message: 'Please set up a primary device before logging in from new devices.',
          };
        }

        // User has primary device - create new device and require verification
        const deviceId = uuidv4();
        const verificationToken = randomBytes(32).toString('hex');
        const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

        const newDevice = {
          id: deviceId,
          userId: user.getId().toString(),
          deviceFingerprint: fingerprint.fingerprint,
          deviceName: fingerprint.deviceName,
          deviceType: fingerprint.deviceType,
          userAgent: input.deviceInfo.userAgent,
          ipAddress: input.ipAddress || null,
          isPrimary: false,
          isVerified: false,
          verificationToken,
          verificationExpiresAt,
          lastUsedAt: new Date(),
          createdAt: new Date(),
          revokedAt: null,
        };

        await this.deviceRepository.save(newDevice);

        // Send verification email
        const emailTemplate = EmailTemplates.newDeviceLogin(
          user.getEmail().toString(),
          newDevice.deviceName,
          input.ipAddress || 'unknown',
          verificationToken
        );
        await this.emailService.sendEmail({
          to: user.getEmail().toString(),
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        });

        return {
          sessionToken: SessionService.createSession(user.getId().toString(), user.getEmail().toString()),
          expiresIn: 180,
          requiresDeviceVerification: true,
          deviceId,
          verificationToken,
          message: 'New device detected. Please verify it using the link sent to your email.',
        };
      }
    }

    // No device info or device is verified - proceed normally
    const sessionToken = SessionService.createSession(
      user.getId().toString(),
      user.getEmail().toString()
    );

    return {
      sessionToken,
      expiresIn: 180,
    };
  }
}

