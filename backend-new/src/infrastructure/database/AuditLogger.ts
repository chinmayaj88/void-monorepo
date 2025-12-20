import { Pool } from 'pg';
import { DatabaseConnection } from './DatabaseConnection';
import { logger } from '@infrastructure/config/Logger';
import { v4 as uuidv4 } from 'uuid';

export enum AuditEventType {
    // Authentication events
    LOGIN_SUCCESS = 'LOGIN_SUCCESS',
    LOGIN_FAILED = 'LOGIN_FAILED',
    LOGOUT = 'LOGOUT',
    PASSWORD_CHANGED = 'PASSWORD_CHANGED',
    PASSWORD_RESET_REQUESTED = 'PASSWORD_RESET_REQUESTED',
    PASSWORD_RESET_COMPLETED = 'PASSWORD_RESET_COMPLETED',
    EMAIL_VERIFIED = 'EMAIL_VERIFIED',
    EMAIL_VERIFICATION_SENT = 'EMAIL_VERIFICATION_SENT',
    TOTP_VERIFIED = 'TOTP_VERIFIED',
    TOTP_REGENERATED = 'TOTP_REGENERATED',
    
    // Device events
    DEVICE_VERIFIED = 'DEVICE_VERIFIED',
    DEVICE_REVOKED = 'DEVICE_REVOKED',
    PRIMARY_DEVICE_SET = 'PRIMARY_DEVICE_SET',
    
    // Account events
    USER_REGISTERED = 'USER_REGISTERED',
    ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
    ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
    
    // Recovery email
    RECOVERY_EMAIL_SETUP = 'RECOVERY_EMAIL_SETUP',
    RECOVERY_EMAIL_VERIFIED = 'RECOVERY_EMAIL_VERIFIED',
    
    // Security events
    SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
    IP_WHITELIST_ADDED = 'IP_WHITELIST_ADDED',
    IP_WHITELIST_REMOVED = 'IP_WHITELIST_REMOVED',
}

export interface AuditLogEntry {
    id: string;
    userId: string | null;
    eventType: AuditEventType;
    description: string;
    ipAddress: string | null;
    userAgent: string | null;
    metadata?: Record<string, unknown>;
    createdAt: Date;
}

export class AuditLogger {
    private pool: Pool;

    constructor() {
        this.pool = DatabaseConnection.getPool();
    }

    async log(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): Promise<void> {
        try {
            const id = uuidv4();
            await this.pool.query(
                `INSERT INTO audit_logs (id, user_id, event_type, description, ip_address, user_agent, metadata, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [
                    id,
                    entry.userId,
                    entry.eventType,
                    entry.description,
                    entry.ipAddress,
                    entry.userAgent,
                    entry.metadata ? JSON.stringify(entry.metadata) : null,
                    new Date(),
                ]
            );

            // Also log to console in development
            if (process.env.NODE_ENV === 'development') {
                logger.info('Audit log', {
                    eventType: entry.eventType,
                    userId: entry.userId,
                    description: entry.description,
                });
            }
        } catch (error) {
            // Don't throw - audit logging should not break the application
            logger.error('Failed to write audit log', {
                error: error instanceof Error ? error.message : error,
            });
        }
    }
}

export const auditLogger = new AuditLogger();


