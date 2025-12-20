import { ISessionRepository } from '@application/interfaces/ISessionRepository';
import { createHash } from 'crypto';
import { logger } from '@infrastructure/config/Logger';

export interface LogoutInput {
  refreshToken: string;
}

export interface LogoutOutput {
  success: boolean;
  message: string;
}

export class LogoutUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

    async execute(input: LogoutInput): Promise<LogoutOutput> {
        // Find and revoke session
        const refreshTokenHash = createHash('sha256').update(input.refreshToken).digest('hex');
        const session = await this.sessionRepository.findByRefreshTokenHash(refreshTokenHash);
        
        if (session) {
            await this.sessionRepository.revokeSession(session.id);
            logger.info('Session revoked on logout', {
                sessionId: session.id,
                userId: session.userId,
            });

            // Log audit event
            const { auditLogger, AuditEventType } = await import('@infrastructure/database/AuditLogger');
            await auditLogger.log({
                userId: session.userId,
                eventType: AuditEventType.LOGOUT,
                description: 'User logged out',
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                metadata: { sessionId: session.id, deviceId: session.deviceId },
            });
        }

        return {
            success: true,
            message: 'Logged out successfully',
        };
    }
}

