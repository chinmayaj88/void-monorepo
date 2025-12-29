export class EmailTemplates {
    private static readonly baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    private static readonly appName = process.env.APP_NAME || 'Void Cloud Drive';

    static emailVerification(_email: string, token: string): { subject: string; html: string; text: string } {
        const verificationUrl = `${this.baseUrl}/verify-email?token=${token}`;
        
        return {
            subject: `Verify your ${this.appName} email address`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 40px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Verify your email address</h1>
                        <p>Hello,</p>
                        <p>Please verify your email address by clicking the button below:</p>
                        <a href="${verificationUrl}" class="button">Verify Email</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
                        <p>This link will expire in 24 hours.</p>
                        <p>If you didn't create an account, please ignore this email.</p>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Verify your ${this.appName} email address
                
                Hello,
                
                Please verify your email address by visiting this link:
                ${verificationUrl}
                
                This link will expire in 24 hours.
                
                If you didn't create an account, please ignore this email.
            `,
        };
    }

    static passwordReset(_email: string, token: string): { subject: string; html: string; text: string } {
        const resetUrl = `${this.baseUrl}/reset-password?token=${token}`;
        
        return {
            subject: `Reset your ${this.appName} password`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .button { display: inline-block; padding: 12px 24px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 40px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Reset your password</h1>
                        <p>Hello,</p>
                        <p>We received a request to reset your password. Click the button below to reset it:</p>
                        <a href="${resetUrl}" class="button">Reset Password</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p><a href="${resetUrl}">${resetUrl}</a></p>
                        <div class="warning">
                            <strong>Security Notice:</strong> This link will expire in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Reset your ${this.appName} password
                
                Hello,
                
                We received a request to reset your password. Visit this link to reset it:
                ${resetUrl}
                
                This link will expire in 1 hour.
                
                If you didn't request a password reset, please ignore this email.
            `,
        };
    }

    static newDeviceLogin(_email: string, deviceName: string, ipAddress: string, verificationToken: string): { subject: string; html: string; text: string } {
        const verificationUrl = `${this.baseUrl}/verify-device?token=${verificationToken}`;
        
        return {
            subject: `New device login detected - ${this.appName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .alert { background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .button { display: inline-block; padding: 12px 24px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 40px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>New device login detected</h1>
                        <div class="alert">
                            <strong>Security Alert:</strong> A login attempt was made from a new device.
                        </div>
                        <p>Hello,</p>
                        <p>We detected a login attempt from a new device:</p>
                        <div class="info">
                            <p><strong>Device:</strong> ${deviceName}</p>
                            <p><strong>IP Address:</strong> ${ipAddress}</p>
                            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <p>To secure your account, please verify this device by clicking the button below:</p>
                        <a href="${verificationUrl}" class="button">Verify Device</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
                        <p><strong>If this wasn't you:</strong> Please ignore this email and consider changing your password immediately.</p>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                New device login detected - ${this.appName}
                
                Security Alert: A login attempt was made from a new device.
                
                Hello,
                
                We detected a login attempt from a new device:
                Device: ${deviceName}
                IP Address: ${ipAddress}
                Time: ${new Date().toLocaleString()}
                
                To secure your account, please verify this device by visiting:
                ${verificationUrl}
                
                If this wasn't you, please ignore this email and consider changing your password immediately.
            `,
        };
    }

    static recoveryEmailVerification(_email: string, token: string): { subject: string; html: string; text: string } {
        const verificationUrl = `${this.baseUrl}/verify-recovery-email?token=${token}`;
        
        return {
            subject: `Verify recovery email - ${this.appName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .button { display: inline-block; padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 40px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Verify recovery email</h1>
                        <p>Hello,</p>
                        <p>You've added this email as a recovery email for your ${this.appName} account. Please verify it by clicking the button below:</p>
                        <a href="${verificationUrl}" class="button">Verify Recovery Email</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
                        <p>This link will expire in 24 hours.</p>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Verify recovery email - ${this.appName}
                
                Hello,
                
                You've added this email as a recovery email for your ${this.appName} account. Please verify it by visiting:
                ${verificationUrl}
                
                This link will expire in 24 hours.
            `,
        };
    }
}

