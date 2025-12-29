import { UserId } from '@domain/value-objects/UserId';

export interface Session {
    id: string;
    userId: string;
    deviceId: string | null;
    refreshTokenHash: string;
    accessTokenHash: string | null;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: Date;
    expiresAt: Date;
    revokedAt: Date | null;
    lastActivityAt: Date;
}

export interface ISessionRepository {
    save(session: Session): Promise<void>;
    findById(sessionId: string): Promise<Session | null>;
    findByRefreshTokenHash(refreshTokenHash: string): Promise<Session | null>;
    findByAccessTokenHash(accessTokenHash: string): Promise<Session | null>;
    findByUserId(userId: UserId): Promise<Session[]>;
    findByDeviceId(deviceId: string): Promise<Session[]>;
    revokeSession(sessionId: string): Promise<void>;
    revokeAllUserSessions(userId: UserId, exceptSessionId?: string): Promise<void>;
    revokeDeviceSessions(deviceId: string): Promise<void>;
    deleteExpiredSessions(): Promise<void>;
    delete(sessionId: string): Promise<void>;
    updateLastActivity(sessionId: string): Promise<void>;
}

