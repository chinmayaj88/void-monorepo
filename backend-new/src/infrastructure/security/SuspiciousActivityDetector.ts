import { Pool } from 'pg';
import { DatabaseConnection } from '@infrastructure/database/DatabaseConnection';
import { UserId } from '@domain/value-objects/UserId';
import { IEmailService } from '@infrastructure/email/EmailService';
import { auditLogger, AuditEventType } from '@infrastructure/database/AuditLogger';
import { logger } from '@infrastructure/config/Logger';
import { EmailTemplates } from '@infrastructure/email/EmailTemplates';

export interface SuspiciousActivityResult {
    isSuspicious: boolean;
    reason?: string;
}

export class SuspiciousActivityDetector {
    private pool: Pool;
    private readonly MULTIPLE_IP_THRESHOLD = 3; // 3 different IPs in 1 hour
    private readonly TIME_WINDOW_MS = 60 * 60 * 1000; // 1 hour

    constructor(private readonly emailService: IEmailService) {
        this.pool = DatabaseConnection.getPool();
    }

    async checkSuspiciousActivity(
        userId: UserId,
        ipAddress: string,
        userEmail: string
    ): Promise<SuspiciousActivityResult> {
        // Check for multiple IPs logging in within a short time
        const oneHourAgo = new Date(Date.now() - this.TIME_WINDOW_MS);
        const result = await this.pool.query(
            `SELECT DISTINCT ip_address, COUNT(*) as login_count
             FROM sessions
             WHERE user_id = $1
             AND created_at > $2
             AND revoked_at IS NULL
             GROUP BY ip_address`,
            [userId.toString(), oneHourAgo]
        );

        const uniqueIPs = result.rows.length;
        const currentIPExists = result.rows.some((row: { ip_address: string }) => row.ip_address === ipAddress);

        if (uniqueIPs >= this.MULTIPLE_IP_THRESHOLD && !currentIPExists) {
            // Multiple IPs detected - suspicious
            await this.handleSuspiciousActivity(
                userId,
                ipAddress,
                userEmail,
                `Multiple IP addresses (${uniqueIPs}) detected logging in within 1 hour`
            );
            return {
                isSuspicious: true,
                reason: 'Multiple IP addresses detected',
            };
        }

        return { isSuspicious: false };
    }

    private async handleSuspiciousActivity(
        userId: UserId,
        ipAddress: string,
        userEmail: string,
        reason: string
    ): Promise<void> {
        // Mark user as having suspicious activity
        await this.pool.query(
            `UPDATE users 
             SET suspicious_activity_detected = TRUE, 
                 last_suspicious_activity_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [userId.toString()]
        );

        // Send notification email
        try {
            const template = EmailTemplates.suspiciousActivity(
                userEmail,
                reason,
                ipAddress,
                new Date().toLocaleString()
            );
            await this.emailService.sendEmail({
                to: userEmail,
                subject: template.subject,
                html: template.html,
                text: template.text,
            });
        } catch (error) {
            logger.error('Failed to send suspicious activity notification', {
                error: error instanceof Error ? error.message : error,
            });
        }

        // Audit log
        await auditLogger.log({
            userId: userId.toString(),
            eventType: AuditEventType.LOGIN_SUCCESS, // Using existing event type
            description: `Suspicious activity detected: ${reason}`,
            ipAddress,
            userAgent: null,
            metadata: { reason, detectedAt: new Date().toISOString() },
        });

        logger.warn('Suspicious activity detected', {
            userId: userId.toString(),
            ipAddress,
            reason,
        });
    }
}

