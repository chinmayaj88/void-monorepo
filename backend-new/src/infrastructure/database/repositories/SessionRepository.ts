import { Pool } from 'pg';
import { UserId } from '@domain/value-objects/UserId';
import { ISessionRepository, Session } from '@application/interfaces/ISessionRepository';

interface SessionRow {
    id: string;
    user_id: string;
    device_id: string | null;
    refresh_token_hash: string;
    access_token_hash: string | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Date;
    expires_at: Date;
    revoked_at: Date | null;
    last_activity_at: Date;
}

export class SessionRepository implements ISessionRepository {
    constructor(private readonly pool: Pool) {}

    async save(session: Session): Promise<void> {
        const client = await this.pool.connect();
        try {
            const exists = await this.findById(session.id);
            
            if (exists) {
                await client.query(
                    `UPDATE sessions 
                     SET access_token_hash = $1, revoked_at = $2, last_activity_at = $4
                     WHERE id = $3`,
                    [
                        session.accessTokenHash,
                        session.revokedAt,
                        session.id,
                        session.lastActivityAt || new Date(),
                    ]
                );
            } else {
                await client.query(
                    `INSERT INTO sessions (id, user_id, device_id, refresh_token_hash, access_token_hash, ip_address, user_agent, created_at, expires_at, revoked_at, last_activity_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
                    [
                        session.id,
                        session.userId,
                        session.deviceId,
                        session.refreshTokenHash,
                        session.accessTokenHash,
                        session.ipAddress,
                        session.userAgent,
                        session.createdAt,
                        session.expiresAt,
                        session.revokedAt,
                        session.lastActivityAt || session.createdAt,
                    ]
                );
            }
        } finally {
            client.release();
        }
    }

    async findById(sessionId: string): Promise<Session | null> {
        const result = await this.pool.query<SessionRow>(
            'SELECT * FROM sessions WHERE id = $1',
            [sessionId]
        );
        return this.mapFirstRow(result);
    }

    async findByRefreshTokenHash(refreshTokenHash: string): Promise<Session | null> {
        const result = await this.pool.query<SessionRow>(
            'SELECT * FROM sessions WHERE refresh_token_hash = $1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP',
            [refreshTokenHash]
        );
        return this.mapFirstRow(result);
    }

    async findByAccessTokenHash(accessTokenHash: string): Promise<Session | null> {
        const result = await this.pool.query<SessionRow>(
            `SELECT * FROM sessions 
             WHERE access_token_hash = $1 
             AND revoked_at IS NULL 
             AND expires_at > CURRENT_TIMESTAMP
             AND (last_activity_at IS NULL OR last_activity_at > CURRENT_TIMESTAMP - INTERVAL '30 minutes')
             AND created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'`,
            [accessTokenHash]
        );
        return this.mapFirstRow(result);
    }

    async findByUserId(userId: UserId): Promise<Session[]> {
        const result = await this.pool.query<SessionRow>(
            'SELECT * FROM sessions WHERE user_id = $1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC',
            [userId.toString()]
        );
        return result.rows.map(row => this.mapRowToSession(row));
    }

    async findByDeviceId(deviceId: string): Promise<Session[]> {
        const result = await this.pool.query<SessionRow>(
            'SELECT * FROM sessions WHERE device_id = $1 AND revoked_at IS NULL AND expires_at > CURRENT_TIMESTAMP',
            [deviceId]
        );
        return result.rows.map(row => this.mapRowToSession(row));
    }

    async revokeSession(sessionId: string): Promise<void> {
        await this.pool.query(
            'UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1',
            [sessionId]
        );
    }

    async revokeAllUserSessions(userId: UserId, exceptSessionId?: string): Promise<void> {
        if (exceptSessionId) {
            await this.pool.query(
                'UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id != $2',
                [userId.toString(), exceptSessionId]
            );
        } else {
            await this.pool.query(
                'UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1',
                [userId.toString()]
            );
        }
    }

    async revokeDeviceSessions(deviceId: string): Promise<void> {
        await this.pool.query(
            'UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE device_id = $1',
            [deviceId]
        );
    }

    async deleteExpiredSessions(): Promise<void> {
        await this.pool.query(
            'DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at IS NOT NULL'
        );
    }

    async delete(sessionId: string): Promise<void> {
        await this.pool.query('DELETE FROM sessions WHERE id = $1', [sessionId]);
    }

    async updateLastActivity(sessionId: string): Promise<void> {
        await this.pool.query(
            'UPDATE sessions SET last_activity_at = CURRENT_TIMESTAMP WHERE id = $1',
            [sessionId]
        );
    }

    private mapFirstRow(result: { rows: SessionRow[] }): Session | null {
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapRowToSession(result.rows[0]);
    }

    private mapRowToSession(row: SessionRow): Session {
        return {
            id: row.id,
            userId: row.user_id,
            deviceId: row.device_id,
            refreshTokenHash: row.refresh_token_hash,
            accessTokenHash: row.access_token_hash,
            ipAddress: row.ip_address,
            userAgent: row.user_agent,
            createdAt: row.created_at,
            expiresAt: row.expires_at,
            revokedAt: row.revoked_at,
            lastActivityAt: row.last_activity_at || row.created_at,
        };
    }
}

