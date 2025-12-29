import { logger } from '@infrastructure/config/Logger';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export interface IEmailService {
    sendEmail(options: EmailOptions): Promise<void>;
}

export class EmailService implements IEmailService {
    private readonly smtpEnabled: boolean;

    constructor() {
        this.smtpEnabled = process.env.SMTP_ENABLED === 'true';
    }

    async sendEmail(options: EmailOptions): Promise<void> {
        if (!this.smtpEnabled) {
            // In development, just log the email
            logger.info('Email would be sent (SMTP disabled)', {
                to: options.to,
                subject: options.subject,
            });
            logger.debug('Email content', { html: options.html });
            return;
        }

        // TODO: Implement actual SMTP sending (using nodemailer, sendgrid, etc.)
        // For now, we'll log it
        logger.info('Email sent', {
            to: options.to,
            subject: options.subject,
        });

        // In production, you would use:
        // - Nodemailer for SMTP
        // - SendGrid API
        // - AWS SES
        // - Or any other email service
        throw new Error('SMTP sending not yet implemented. Set SMTP_ENABLED=false for development.');
    }
}

