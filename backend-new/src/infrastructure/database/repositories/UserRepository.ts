import { Pool } from 'pg';
import { User } from '@domain/entities/User';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { Role } from '@domain/value-objects/Role';
import { IUserRepository } from '@application/interfaces/IUserRepository';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  totp_secret: string;
  role: string;
  created_at: Date;
  updated_at: Date;
  email_verified: boolean | null;
  email_verification_token: string | null;
  email_verification_expires_at: Date | null;
  password_reset_token: string | null;
  password_reset_expires_at: Date | null;
  failed_login_attempts: number | null;
  account_locked_until: Date | null;
  last_login_at: Date | null;
  recovery_email: string | null;
  recovery_email_verified: boolean | null;
  recovery_email_verification_token: string | null;
}

export class UserRepository implements IUserRepository {
  constructor(private readonly pool: Pool) {}

  async save(user: User): Promise<void> {
    const client = await this.pool.connect();
    try {
      const exists = await this.findById(user.getId());
      
      if (exists) {
        await client.query(
          `UPDATE users 
           SET email = $1, password_hash = $2, totp_secret = $3, role = $4, updated_at = $5
           WHERE id = $6`,
          [
            user.getEmail().toString(),
            user.getPasswordHash(),
            user.getTotpSecret(),
            user.getRole().toString(),
            user.getUpdatedAt(),
            user.getId().toString(),
          ]
        );
      } else {
        await client.query(
          `INSERT INTO users (id, email, password_hash, totp_secret, role, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            user.getId().toString(),
            user.getEmail().toString(),
            user.getPasswordHash(),
            user.getTotpSecret(),
            user.getRole().toString(),
            user.getCreatedAt(),
            user.getUpdatedAt(),
          ]
        );
      }
    } finally {
      client.release();
    }
  }

  async findById(id: UserId): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE id = $1',
      [id.toString()]
    );

    return this.mapFirstRow(result);
  }

  async findByEmail(email: Email): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE email = $1',
      [email.toString()]
    );

    return this.mapFirstRow(result);
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM users WHERE email = $1 LIMIT 1',
      [email.toString()]
    );

    return result.rows.length > 0;
  }

  async delete(id: UserId): Promise<void> {
    await this.pool.query('DELETE FROM users WHERE id = $1', [id.toString()]);
  }

  async updateEmailVerificationToken(userId: UserId, token: string | null, expiresAt: Date | null): Promise<void> {
    await this.pool.query(
      'UPDATE users SET email_verification_token = $1, email_verification_expires_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [token, expiresAt, userId.toString()]
    );
  }

  async markEmailAsVerified(userId: UserId): Promise<void> {
    await this.pool.query(
      'UPDATE users SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires_at = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId.toString()]
    );
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE email_verification_token = $1 AND email_verification_expires_at > CURRENT_TIMESTAMP',
      [token]
    );
    return this.mapFirstRow(result);
  }

  async updatePasswordResetToken(userId: UserId, token: string | null, expiresAt: Date | null): Promise<void> {
    await this.pool.query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires_at = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [token, expiresAt, userId.toString()]
    );
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires_at > CURRENT_TIMESTAMP',
      [token]
    );
    return this.mapFirstRow(result);
  }

  async incrementFailedLoginAttempts(userId: UserId): Promise<void> {
    await this.pool.query(
      'UPDATE users SET failed_login_attempts = COALESCE(failed_login_attempts, 0) + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId.toString()]
    );
  }

  async resetFailedLoginAttempts(userId: UserId): Promise<void> {
    await this.pool.query(
      'UPDATE users SET failed_login_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId.toString()]
    );
  }

  async lockAccount(userId: UserId, until: Date): Promise<void> {
    await this.pool.query(
      'UPDATE users SET account_locked_until = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [until, userId.toString()]
    );
  }

  async unlockAccount(userId: UserId): Promise<void> {
    await this.pool.query(
      'UPDATE users SET account_locked_until = NULL, failed_login_attempts = 0, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId.toString()]
    );
  }

  async updateLastLogin(userId: UserId): Promise<void> {
    await this.pool.query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId.toString()]
    );
  }

  async updateRecoveryEmail(userId: UserId, email: string | null): Promise<void> {
    await this.pool.query(
      'UPDATE users SET recovery_email = $1, recovery_email_verified = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [email, userId.toString()]
    );
  }

  async updateRecoveryEmailVerificationToken(userId: UserId, token: string | null): Promise<void> {
    await this.pool.query(
      'UPDATE users SET recovery_email_verification_token = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [token, userId.toString()]
    );
  }

  async markRecoveryEmailAsVerified(userId: UserId): Promise<void> {
    await this.pool.query(
      'UPDATE users SET recovery_email_verified = TRUE, recovery_email_verification_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [userId.toString()]
    );
  }

  async findByRecoveryEmailVerificationToken(token: string): Promise<User | null> {
    const result = await this.pool.query<UserRow>(
      'SELECT * FROM users WHERE recovery_email_verification_token = $1',
      [token]
    );
    return this.mapFirstRow(result);
  }

  async updateTotpSecret(userId: UserId, totpSecret: string): Promise<void> {
    await this.pool.query(
      'UPDATE users SET totp_secret = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [totpSecret, userId.toString()]
    );
  }

  private mapFirstRow(result: { rows: UserRow[] }): User | null {
    if (result.rows.length === 0) {
      return null;
    }
    return this.mapRowToUser(result.rows[0]);
  }

  private mapRowToUser(row: UserRow): User {
    return User.reconstitute(
      UserId.fromString(row.id),
      Email.fromString(row.email),
      row.password_hash,
      row.totp_secret,
      Role.fromString(row.role),
      row.created_at,
      row.updated_at,
      row.email_verified || false,
      row.email_verification_token,
      row.email_verification_expires_at,
      row.password_reset_token,
      row.password_reset_expires_at,
      row.failed_login_attempts || 0,
      row.account_locked_until,
      row.last_login_at,
      row.recovery_email ? Email.fromString(row.recovery_email) : null,
      row.recovery_email_verified || false,
      row.recovery_email_verification_token
    );
  }
}

