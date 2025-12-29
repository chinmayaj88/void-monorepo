import { Pool } from 'pg';
import { UserId } from '@domain/value-objects/UserId';
import { IDeviceRepository, Device } from '@application/interfaces/IDeviceRepository';

interface DeviceRow {
    id: string;
    user_id: string;
    device_fingerprint: string;
    device_name: string;
    device_type: string;
    user_agent: string | null;
    ip_address: string | null;
    is_primary: boolean;
    is_verified: boolean;
    verification_token: string | null;
    verification_expires_at: Date | null;
    last_used_at: Date;
    created_at: Date;
    revoked_at: Date | null;
}

export class DeviceRepository implements IDeviceRepository {
    constructor(private readonly pool: Pool) {}

    async save(device: Device): Promise<void> {
        const client = await this.pool.connect();
        try {
            const exists = await this.findById(device.id);
            
            if (exists) {
                await client.query(
                    `UPDATE devices 
                     SET device_name = $1, device_type = $2, user_agent = $3, ip_address = $4,
                         is_primary = $5, is_verified = $6, verification_token = $7,
                         verification_expires_at = $8, last_used_at = $9, revoked_at = $10
                     WHERE id = $11`,
                    [
                        device.deviceName,
                        device.deviceType,
                        device.userAgent,
                        device.ipAddress,
                        device.isPrimary,
                        device.isVerified,
                        device.verificationToken,
                        device.verificationExpiresAt,
                        device.lastUsedAt,
                        device.revokedAt,
                        device.id,
                    ]
                );
            } else {
                await client.query(
                    `INSERT INTO devices (id, user_id, device_fingerprint, device_name, device_type, user_agent, ip_address, is_primary, is_verified, verification_token, verification_expires_at, last_used_at, created_at, revoked_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                    [
                        device.id,
                        device.userId,
                        device.deviceFingerprint,
                        device.deviceName,
                        device.deviceType,
                        device.userAgent,
                        device.ipAddress,
                        device.isPrimary,
                        device.isVerified,
                        device.verificationToken,
                        device.verificationExpiresAt,
                        device.lastUsedAt,
                        device.createdAt,
                        device.revokedAt,
                    ]
                );
            }
        } finally {
            client.release();
        }
    }

    async findById(deviceId: string): Promise<Device | null> {
        const result = await this.pool.query<DeviceRow>(
            'SELECT * FROM devices WHERE id = $1',
            [deviceId]
        );
        return this.mapFirstRow(result);
    }

    async findByUserId(userId: UserId): Promise<Device[]> {
        const result = await this.pool.query<DeviceRow>(
            'SELECT * FROM devices WHERE user_id = $1 AND revoked_at IS NULL ORDER BY created_at DESC',
            [userId.toString()]
        );
        return result.rows.map(row => this.mapRowToDevice(row));
    }

    async findByFingerprint(userId: UserId, fingerprint: string): Promise<Device | null> {
        const result = await this.pool.query<DeviceRow>(
            'SELECT * FROM devices WHERE user_id = $1 AND device_fingerprint = $2 AND revoked_at IS NULL',
            [userId.toString(), fingerprint]
        );
        return this.mapFirstRow(result);
    }

    async findPrimaryDevice(userId: UserId): Promise<Device | null> {
        const result = await this.pool.query<DeviceRow>(
            'SELECT * FROM devices WHERE user_id = $1 AND is_primary = TRUE AND revoked_at IS NULL LIMIT 1',
            [userId.toString()]
        );
        return this.mapFirstRow(result);
    }

    async findVerifiedDevices(userId: UserId): Promise<Device[]> {
        const result = await this.pool.query<DeviceRow>(
            'SELECT * FROM devices WHERE user_id = $1 AND is_verified = TRUE AND revoked_at IS NULL ORDER BY last_used_at DESC',
            [userId.toString()]
        );
        return result.rows.map(row => this.mapRowToDevice(row));
    }

    async revokeDevice(deviceId: string): Promise<void> {
        await this.pool.query(
            'UPDATE devices SET revoked_at = CURRENT_TIMESTAMP WHERE id = $1',
            [deviceId]
        );
    }

    async revokeAllDevices(userId: UserId, exceptDeviceId?: string): Promise<void> {
        if (exceptDeviceId) {
            await this.pool.query(
                'UPDATE devices SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND id != $2',
                [userId.toString(), exceptDeviceId]
            );
        } else {
            await this.pool.query(
                'UPDATE devices SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1',
                [userId.toString()]
            );
        }
    }

    async delete(deviceId: string): Promise<void> {
        await this.pool.query('DELETE FROM devices WHERE id = $1', [deviceId]);
    }

    private mapFirstRow(result: { rows: DeviceRow[] }): Device | null {
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapRowToDevice(result.rows[0]);
    }

    private mapRowToDevice(row: DeviceRow): Device {
        return {
            id: row.id,
            userId: row.user_id,
            deviceFingerprint: row.device_fingerprint,
            deviceName: row.device_name,
            deviceType: row.device_type as 'desktop' | 'mobile' | 'tablet' | 'unknown',
            userAgent: row.user_agent,
            ipAddress: row.ip_address,
            isPrimary: row.is_primary,
            isVerified: row.is_verified,
            verificationToken: row.verification_token,
            verificationExpiresAt: row.verification_expires_at,
            lastUsedAt: row.last_used_at,
            createdAt: row.created_at,
            revokedAt: row.revoked_at,
        };
    }
}

