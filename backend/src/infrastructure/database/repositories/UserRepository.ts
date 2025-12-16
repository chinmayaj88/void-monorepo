import { Pool } from 'pg';
import { User } from '@domain/entities/User';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { IUserRepository } from '@application/interfaces/IUserRepository';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  totp_secret: string;
  created_at: Date;
  updated_at: Date;
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
           SET email = $1, password_hash = $2, totp_secret = $3, updated_at = $4
           WHERE id = $5`,
          [
            user.getEmail().toString(),
            user.getPasswordHash(),
            user.getTotpSecret(),
            user.getUpdatedAt(),
            user.getId().toString(),
          ]
        );
      } else {
        await client.query(
          `INSERT INTO users (id, email, password_hash, totp_secret, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            user.getId().toString(),
            user.getEmail().toString(),
            user.getPasswordHash(),
            user.getTotpSecret(),
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
      row.created_at,
      row.updated_at
    );
  }
}