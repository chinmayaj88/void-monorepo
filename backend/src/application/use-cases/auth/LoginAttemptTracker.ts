import { UserId } from '@domain/value-objects/UserId';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export interface LoginAttempt {
    userId: string | null;
    email: string;
    ipAddress: string;
    success: boolean;
    failureReason?: string;
}

export class LoginAttemptTracker {
    private static readonly MAX_FAILED_ATTEMPTS = 5;
    private static readonly LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

    constructor(
        private readonly userRepository: IUserRepository,
        private readonly pool: Pool
    ) {}

    async recordAttempt(attempt: LoginAttempt): Promise<void> {
        await this.pool.query(
            `INSERT INTO login_attempts (id, user_id, email, ip_address, success, failure_reason, attempted_at)
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
            [
                uuidv4(),
                attempt.userId,
                attempt.email,
                attempt.ipAddress,
                attempt.success,
                attempt.failureReason || null,
            ]
        );
    }

    async checkAccountLockout(userId: UserId): Promise<{ isLocked: boolean; lockedUntil?: Date }> {
        // This would typically check the account_locked_until field
        // For now, we'll check via a query
        const result = await this.pool.query<{ account_locked_until: Date | null }>(
            'SELECT account_locked_until FROM users WHERE id = $1',
            [userId.toString()]
        );

        if (result.rows.length === 0) {
            return { isLocked: false };
        }

        const lockedUntil = result.rows[0].account_locked_until;
        if (!lockedUntil) {
            return { isLocked: false };
        }

        if (lockedUntil > new Date()) {
            return { isLocked: true, lockedUntil };
        }

        // Lockout expired, unlock account
        await this.userRepository.unlockAccount(userId);
        return { isLocked: false };
    }

    async handleFailedLogin(userId: UserId): Promise<void> {
        await this.userRepository.incrementFailedLoginAttempts(userId);

        // Check if we should lock the account
        const result = await this.pool.query<{ failed_login_attempts: number }>(
            'SELECT failed_login_attempts FROM users WHERE id = $1',
            [userId.toString()]
        );

        if (result.rows.length > 0) {
            const failedAttempts = result.rows[0].failed_login_attempts || 0;
            if (failedAttempts >= LoginAttemptTracker.MAX_FAILED_ATTEMPTS) {
                const lockedUntil = new Date(Date.now() + LoginAttemptTracker.LOCKOUT_DURATION_MS);
                await this.userRepository.lockAccount(userId, lockedUntil);
            }
        }
    }

    async handleSuccessfulLogin(userId: UserId): Promise<void> {
        await this.userRepository.resetFailedLoginAttempts(userId);
        await this.userRepository.unlockAccount(userId);
        await this.userRepository.updateLastLogin(userId);
    }
}

