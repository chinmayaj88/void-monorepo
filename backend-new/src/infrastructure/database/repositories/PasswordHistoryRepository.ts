import { Pool } from 'pg';
import { UserId } from '@domain/value-objects/UserId';
import { IPasswordHistoryRepository } from '@application/interfaces/IPasswordHistoryRepository';
import { v4 as uuidv4 } from 'uuid';

interface PasswordHistoryRow {
    id: string;
    user_id: string;
    password_hash: string;
    created_at: Date;
}

export class PasswordHistoryRepository implements IPasswordHistoryRepository {
    constructor(private readonly pool: Pool) {}

    async save(userId: UserId, passwordHash: string): Promise<void> {
        const id = uuidv4();
        await this.pool.query(
            `INSERT INTO password_history (id, user_id, password_hash, created_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
            [id, userId.toString(), passwordHash]
        );
    }

    async getRecentPasswords(userId: UserId, limit: number): Promise<string[]> {
        const result = await this.pool.query<PasswordHistoryRow>(
            `SELECT password_hash FROM password_history
             WHERE user_id = $1
             ORDER BY created_at DESC
             LIMIT $2`,
            [userId.toString(), limit]
        );
        return result.rows.map(row => row.password_hash);
    }

    async clearOldPasswords(userId: UserId, keepCount: number): Promise<void> {
        // Keep only the most recent N passwords
        await this.pool.query(
            `DELETE FROM password_history
             WHERE user_id = $1
             AND id NOT IN (
                 SELECT id FROM password_history
                 WHERE user_id = $1
                 ORDER BY created_at DESC
                 LIMIT $2
             )`,
            [userId.toString(), keepCount]
        );
    }
}

