import nodemailer from 'nodemailer';
import { logger } from '@infrastructure/config/Logger';
import { EmailTemplates } from './EmailTemplates';

export interface IEmailService {
    sendEmail(options: { to: string; subject: string; html: string; text?: string }): Promise<void>;
    sendVerificationEmail(to: string, username: string, verificationLink: string): Promise<void>;
    sendPasswordResetEmail(to: string, username: string, resetLink: string): Promise<void>;
    sendDeviceVerificationEmail(to: string, username: string, deviceName: string, verificationLink: string): Promise<void>;
    sendNewDeviceNotificationEmail(to: string, username: string, deviceName: string, ipAddress: string, loginTime: string): Promise<void>;
    sendRecoveryEmailVerification(to: string, username: string, verificationLink: string): Promise<void>;
}

export class EmailService implements IEmailService {
    private transporter: nodemailer.Transporter | null = null;
    private isEnabled: boolean;
    private fromAddress: string;

    constructor() {
        this.isEnabled = process.env.SMTP_ENABLED === 'true';
        this.fromAddress = process.env.SMTP_FROM_ADDRESS || 'no-reply@void.com';

        if (this.isEnabled) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587', 10),
                secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASSWORD,
                },
            });
            logger.info('Email service enabled and configured.');
        } else {
            logger.warn('Email service is disabled. Set SMTP_ENABLED=true in .env to enable.');
        }
    }

    async sendEmail(options: { to: string; subject: string; html: string; text?: string }): Promise<void> {
        if (!this.isEnabled) {
            logger.info(`Email to ${options.to} not sent (service disabled): ${options.subject}`);
            return;
        }

        if (!this.transporter) {
            throw new Error('Email transporter not initialized');
        }

        try {
            await this.transporter.sendMail({
                from: this.fromAddress,
                to: options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
            });
            logger.info(`Email sent to ${options.to}: ${options.subject}`);
        } catch (error) {
            logger.error(`Failed to send email to ${options.to}: ${options.subject}`, { error: error instanceof Error ? error.message : error });
            throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async sendVerificationEmail(to: string, username: string, verificationLink: string): Promise<void> {
        const template = EmailTemplates.emailVerification(username, verificationLink);
        await this.sendEmail({ to, subject: template.subject, html: template.html, text: template.text });
    }

    async sendPasswordResetEmail(to: string, username: string, resetLink: string): Promise<void> {
        const template = EmailTemplates.passwordReset(username, resetLink);
        await this.sendEmail({ to, subject: template.subject, html: template.html, text: template.text });
    }

    async sendDeviceVerificationEmail(to: string, username: string, deviceName: string, verificationLink: string): Promise<void> {
        const template = EmailTemplates.deviceVerification(username, deviceName, verificationLink);
        await this.sendEmail({ to, subject: template.subject, html: template.html, text: template.text });
    }

    async sendNewDeviceNotificationEmail(to: string, username: string, deviceName: string, ipAddress: string, loginTime: string): Promise<void> {
        const template = EmailTemplates.newDeviceLogin(username, deviceName, ipAddress, loginTime);
        await this.sendEmail({ to, subject: template.subject, html: template.html, text: template.text });
    }

    async sendRecoveryEmailVerification(to: string, username: string, verificationLink: string): Promise<void> {
        const template = EmailTemplates.recoveryEmailVerification(username, verificationLink);
        await this.sendEmail({ to, subject: template.subject, html: template.html, text: template.text });
    }
}

