import { Pool } from 'pg';
import { UserId } from '@domain/value-objects/UserId';
import { IIpWhitelistRepository, IpWhitelistEntry } from '@application/interfaces/IIpWhitelistRepository';
import { v4 as uuidv4 } from 'uuid';

interface IpWhitelistRow {
    id: string;
    user_id: string;
    ip_address: string;
    description: string | null;
    created_at: Date;
    created_by: string | null;
}

export class IpWhitelistRepository implements IIpWhitelistRepository {
    constructor(private readonly pool: Pool) {}

    async isWhitelisted(userId: UserId, ipAddress: string): Promise<boolean> {
        const result = await this.pool.query(
            'SELECT 1 FROM ip_whitelist WHERE user_id = $1 AND ip_address = $2 LIMIT 1',
            [userId.toString(), ipAddress]
        );
        return result.rows.length > 0;
    }

    async add(userId: UserId, ipAddress: string, description: string | null, createdBy: UserId | null): Promise<void> {
        const id = uuidv4();
        await this.pool.query(
            `INSERT INTO ip_whitelist (id, user_id, ip_address, description, created_at, created_by)
             VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
             ON CONFLICT (user_id, ip_address) DO NOTHING`,
            [id, userId.toString(), ipAddress, description, createdBy?.toString() || null]
        );
    }

    async remove(userId: UserId, ipAddress: string): Promise<void> {
        await this.pool.query(
            'DELETE FROM ip_whitelist WHERE user_id = $1 AND ip_address = $2',
            [userId.toString(), ipAddress]
        );
    }

    async list(userId: UserId): Promise<IpWhitelistEntry[]> {
        const result = await this.pool.query<IpWhitelistRow>(
            'SELECT * FROM ip_whitelist WHERE user_id = $1 ORDER BY created_at DESC',
            [userId.toString()]
        );
        return result.rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            ipAddress: row.ip_address,
            description: row.description,
            createdAt: row.created_at,
            createdBy: row.created_by,
        }));
    }
}

