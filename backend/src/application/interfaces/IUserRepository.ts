import { User } from "@domain/entities/User";
import { UserId } from "@domain/value-objects/UserId";
import { Email } from "@domain/value-objects/Email";

export interface IUserRepository {
    save(user: User): Promise<void>;
    findById(id: UserId): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    existsByEmail(email: Email): Promise<boolean>;
    delete(id: UserId): Promise<void>;
    // Email verification
    updateEmailVerificationToken(userId: UserId, token: string | null, expiresAt: Date | null): Promise<void>;
    markEmailAsVerified(userId: UserId): Promise<void>;
    findByEmailVerificationToken(token: string): Promise<User | null>;
    // Password reset
    updatePasswordResetToken(userId: UserId, token: string | null, expiresAt: Date | null): Promise<void>;
    findByPasswordResetToken(token: string): Promise<User | null>;
    // Login attempts and lockout
    incrementFailedLoginAttempts(userId: UserId): Promise<void>;
    resetFailedLoginAttempts(userId: UserId): Promise<void>;
    lockAccount(userId: UserId, until: Date): Promise<void>;
    unlockAccount(userId: UserId): Promise<void>;
    updateLastLogin(userId: UserId): Promise<void>;
    // Recovery email
    updateRecoveryEmail(userId: UserId, email: string | null): Promise<void>;
    updateRecoveryEmailVerificationToken(userId: UserId, token: string | null): Promise<void>;
    markRecoveryEmailAsVerified(userId: UserId): Promise<void>;
    findByRecoveryEmailVerificationToken(token: string): Promise<User | null>;
    // TOTP management
    updateTotpSecret(userId: UserId, totpSecret: string): Promise<void>;
}