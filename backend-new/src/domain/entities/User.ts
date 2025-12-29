import { UserId } from '../value-objects/UserId';
import { Email } from '../value-objects/Email';
import { Role } from '../value-objects/Role';

export class User {
    private constructor(
        private readonly id: UserId,
        private email: Email,
        private passwordHash: string,
        private totpSecret: string,
        private readonly role: Role,
        private readonly createdAt: Date,
        private updatedAt: Date,
        // Email verification fields
        private emailVerified: boolean = false,
        private emailVerificationToken: string | null = null,
        private emailVerificationExpiresAt: Date | null = null,
        // Password reset fields
        private passwordResetToken: string | null = null,
        private passwordResetExpiresAt: Date | null = null,
        // Login tracking fields
        private failedLoginAttempts: number = 0,
        private accountLockedUntil: Date | null = null,
        private lastLoginAt: Date | null = null,
        // Recovery email fields
        private recoveryEmail: Email | null = null,
        private recoveryEmailVerified: boolean = false,
        private recoveryEmailVerificationToken: string | null = null
    ) {
        this.validate();
    }

    static create(
        id: UserId,
        email: Email,
        passwordHash: string,
        totpSecret: string,
        role: Role
    ): User {
        const now = new Date();
        return new User(
            id,
            email,
            passwordHash,
            totpSecret,
            role,
            now,
            now
        );
    }

    static reconstitute(
        id: UserId,
        email: Email,
        passwordHash: string,
        totpSecret: string,
        role: Role,
        createdAt: Date,
        updatedAt: Date,
        emailVerified: boolean = false,
        emailVerificationToken: string | null = null,
        emailVerificationExpiresAt: Date | null = null,
        passwordResetToken: string | null = null,
        passwordResetExpiresAt: Date | null = null,
        failedLoginAttempts: number = 0,
        accountLockedUntil: Date | null = null,
        lastLoginAt: Date | null = null,
        recoveryEmail: Email | null = null,
        recoveryEmailVerified: boolean = false,
        recoveryEmailVerificationToken: string | null = null
    ): User {
        return new User(
            id,
            email,
            passwordHash,
            totpSecret,
            role,
            createdAt,
            updatedAt,
            emailVerified,
            emailVerificationToken,
            emailVerificationExpiresAt,
            passwordResetToken,
            passwordResetExpiresAt,
            failedLoginAttempts,
            accountLockedUntil,
            lastLoginAt,
            recoveryEmail,
            recoveryEmailVerified,
            recoveryEmailVerificationToken
        );
    }

    private validate(): void {
        if (this.isEmpty(this.passwordHash)) {
            throw new Error('Password hash cannot be empty');
        }

        if (this.isEmpty(this.totpSecret)) {
            throw new Error('TOTP secret cannot be empty');
        }
    }

    private isEmpty(value: string): boolean {
        return !value || value.trim().length === 0;
    }

    // Getters
    getId(): UserId {
        return this.id;
    }

    getEmail(): Email {
        return this.email;
    }

    getPasswordHash(): string {
        return this.passwordHash;
    }

    getTotpSecret(): string {
        return this.totpSecret;
    }

    getRole(): Role {
        return this.role;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    isEmailVerified(): boolean {
        return this.emailVerified;
    }

    getEmailVerificationToken(): string | null {
        return this.emailVerificationToken;
    }

    getEmailVerificationExpiresAt(): Date | null {
        return this.emailVerificationExpiresAt;
    }

    getPasswordResetToken(): string | null {
        return this.passwordResetToken;
    }

    getPasswordResetExpiresAt(): Date | null {
        return this.passwordResetExpiresAt;
    }

    getFailedLoginAttempts(): number {
        return this.failedLoginAttempts;
    }

    getAccountLockedUntil(): Date | null {
        return this.accountLockedUntil;
    }

    getLastLoginAt(): Date | null {
        return this.lastLoginAt;
    }

    getRecoveryEmail(): Email | null {
        return this.recoveryEmail;
    }

    isRecoveryEmailVerified(): boolean {
        return this.recoveryEmailVerified;
    }

    getRecoveryEmailVerificationToken(): string | null {
        return this.recoveryEmailVerificationToken;
    }

    // Business logic methods
    isAdmin(): boolean {
        return this.role.isAdmin();
    }

    isUser(): boolean {
        return this.role.isUser();
    }

    isAccountLocked(): boolean {
        if (!this.accountLockedUntil) {
            return false;
        }
        return this.accountLockedUntil > new Date();
    }

    updateEmail(newEmail: Email): void {
        this.email = newEmail;
        this.updatedAt = new Date();
    }

    updatePassword(newPasswordHash: string): void {
        if (this.isEmpty(newPasswordHash)) {
            throw new Error('Password hash cannot be empty');
        }
        this.passwordHash = newPasswordHash;
        this.updatedAt = new Date();
    }

    markEmailAsVerified(): void {
        this.emailVerified = true;
        this.emailVerificationToken = null;
        this.emailVerificationExpiresAt = null;
        this.updatedAt = new Date();
    }

    setEmailVerificationToken(token: string | null, expiresAt: Date | null): void {
        this.emailVerificationToken = token;
        this.emailVerificationExpiresAt = expiresAt;
        this.updatedAt = new Date();
    }

    setPasswordResetToken(token: string | null, expiresAt: Date | null): void {
        this.passwordResetToken = token;
        this.passwordResetExpiresAt = expiresAt;
        this.updatedAt = new Date();
    }

    clearPasswordResetToken(): void {
        this.passwordResetToken = null;
        this.passwordResetExpiresAt = null;
        this.updatedAt = new Date();
    }

    setRecoveryEmailVerificationToken(token: string | null): void {
        this.recoveryEmailVerificationToken = token;
        this.updatedAt = new Date();
    }

    incrementFailedLoginAttempts(): void {
        this.failedLoginAttempts += 1;
        this.updatedAt = new Date();
    }

    resetFailedLoginAttempts(): void {
        this.failedLoginAttempts = 0;
        this.updatedAt = new Date();
    }

    lockAccount(until: Date): void {
        this.accountLockedUntil = until;
        this.updatedAt = new Date();
    }

    unlockAccount(): void {
        this.accountLockedUntil = null;
        this.failedLoginAttempts = 0;
        this.updatedAt = new Date();
    }

    updateLastLogin(): void {
        this.lastLoginAt = new Date();
        this.updatedAt = new Date();
    }

    setRecoveryEmail(email: Email | null): void {
        this.recoveryEmail = email;
        this.recoveryEmailVerified = false;
        this.updatedAt = new Date();
    }

    markRecoveryEmailAsVerified(): void {
        this.recoveryEmailVerified = true;
        this.recoveryEmailVerificationToken = null;
        this.updatedAt = new Date();
    }

    updateTotpSecret(totpSecret: string): void {
        if (this.isEmpty(totpSecret)) {
            throw new Error('TOTP secret cannot be empty');
        }
        this.totpSecret = totpSecret;
        this.updatedAt = new Date();
    }

    equals(other: User): boolean {
        return this.id.equals(other.id);
    }
}

