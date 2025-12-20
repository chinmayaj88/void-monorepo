export class EmailTemplates {
    private static readonly appName = process.env.APP_NAME || 'Void Cloud Drive';

    static emailVerification(_email: string, verificationLink: string): { subject: string; html: string; text: string } {
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
                        <a href="${verificationLink}" class="button">Verify Email</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p><a href="${verificationLink}">${verificationLink}</a></p>
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
                ${verificationLink}
                
                This link will expire in 24 hours.
                
                If you didn't create an account, please ignore this email.
            `,
        };
    }

    static passwordReset(_email: string, resetLink: string): { subject: string; html: string; text: string } {
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
                        <a href="${resetLink}" class="button">Reset Password</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p><a href="${resetLink}">${resetLink}</a></p>
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
                ${resetLink}
                
                This link will expire in 1 hour.
                
                If you didn't request a password reset, please ignore this email.
            `,
        };
    }

    static deviceVerification(_email: string, deviceName: string, verificationLink: string): { subject: string; html: string; text: string } {
        return {
            subject: `Verify your new device - ${this.appName}`,
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
                        <h1>Verify your new device</h1>
                        <div class="alert">
                            <strong>Security Alert:</strong> A new device is trying to access your account.
                        </div>
                        <p>Hello,</p>
                        <p>We detected a login attempt from a new device:</p>
                        <div class="info">
                            <p><strong>Device:</strong> ${deviceName}</p>
                            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                        </div>
                        <p>To secure your account, please verify this device by clicking the button below:</p>
                        <a href="${verificationLink}" class="button">Verify Device</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p><a href="${verificationLink}">${verificationLink}</a></p>
                        <p><strong>If this wasn't you:</strong> Please ignore this email and consider changing your password immediately.</p>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Verify your new device - ${this.appName}
                
                Security Alert: A new device is trying to access your account.
                
                Hello,
                
                We detected a login attempt from a new device:
                Device: ${deviceName}
                Time: ${new Date().toLocaleString()}
                
                To secure your account, please verify this device by visiting:
                ${verificationLink}
                
                If this wasn't you, please ignore this email and consider changing your password immediately.
            `,
        };
    }

    static newDeviceLogin(_email: string, deviceName: string, ipAddress: string, loginTime: string): { subject: string; html: string; text: string } {
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
                        .info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 40px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>New device login detected</h1>
                        <div class="alert">
                            <strong>Security Alert:</strong> A login was made from a new device.
                        </div>
                        <p>Hello,</p>
                        <p>We detected a login from a new device:</p>
                        <div class="info">
                            <p><strong>Device:</strong> ${deviceName}</p>
                            <p><strong>IP Address:</strong> ${ipAddress}</p>
                            <p><strong>Time:</strong> ${loginTime}</p>
                        </div>
                        <p><strong>If this wasn't you:</strong> Please change your password immediately and review your account security.</p>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                New device login detected - ${this.appName}
                
                Security Alert: A login was made from a new device.
                
                Hello,
                
                We detected a login from a new device:
                Device: ${deviceName}
                IP Address: ${ipAddress}
                Time: ${loginTime}
                
                If this wasn't you, please change your password immediately and review your account security.
            `,
        };
    }

    static recoveryEmailVerification(_email: string, verificationLink: string): { subject: string; html: string; text: string } {
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
                        <a href="${verificationLink}" class="button">Verify Recovery Email</a>
                        <p>Or copy and paste this link into your browser:</p>
                        <p><a href="${verificationLink}">${verificationLink}</a></p>
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
                ${verificationLink}
                
                This link will expire in 24 hours.
            `,
        };
    }

    static passwordChanged(_email: string, changedAt: string): { subject: string; html: string; text: string } {
        return {
            subject: `Password changed - ${this.appName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .alert { background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 40px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Password changed</h1>
                        <div class="alert">
                            <strong>Security Notice:</strong> Your password has been changed.
                        </div>
                        <p>Hello,</p>
                        <p>This is to confirm that your password was successfully changed.</p>
                        <div class="info">
                            <p><strong>Time:</strong> ${changedAt}</p>
                        </div>
                        <p><strong>If you didn't make this change:</strong> Please contact support immediately and consider reviewing your account security settings.</p>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Password changed - ${this.appName}
                
                Security Notice: Your password has been changed.
                
                Hello,
                
                This is to confirm that your password was successfully changed.
                Time: ${changedAt}
                
                If you didn't make this change, please contact support immediately.
            `,
        };
    }

    static accountLocked(_email: string, lockedUntil: string): { subject: string; html: string; text: string } {
        return {
            subject: `Account locked - ${this.appName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 40px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Account locked</h1>
                        <div class="warning">
                            <strong>Security Alert:</strong> Your account has been temporarily locked due to multiple failed login attempts.
                        </div>
                        <p>Hello,</p>
                        <p>Your account has been temporarily locked for security reasons.</p>
                        <div class="info">
                            <p><strong>Locked until:</strong> ${lockedUntil}</p>
                        </div>
                        <p>This is a security measure to protect your account. You can try logging in again after the lock period expires, or contact support if you need immediate assistance.</p>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Account locked - ${this.appName}
                
                Security Alert: Your account has been temporarily locked due to multiple failed login attempts.
                
                Hello,
                
                Your account has been temporarily locked for security reasons.
                Locked until: ${lockedUntil}
                
                This is a security measure to protect your account. You can try logging in again after the lock period expires.
            `,
        };
    }

    static suspiciousActivity(_email: string, activity: string, ipAddress: string, time: string): { subject: string; html: string; text: string } {
        return {
            subject: `Suspicious activity detected - ${this.appName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .danger { background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .info { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
                        .footer { margin-top: 40px; font-size: 12px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Suspicious activity detected</h1>
                        <div class="danger">
                            <strong>Security Alert:</strong> We detected suspicious activity on your account.
                        </div>
                        <p>Hello,</p>
                        <p>We detected unusual activity on your account:</p>
                        <div class="info">
                            <p><strong>Activity:</strong> ${activity}</p>
                            <p><strong>IP Address:</strong> ${ipAddress}</p>
                            <p><strong>Time:</strong> ${time}</p>
                        </div>
                        <p><strong>If this wasn't you:</strong> Please change your password immediately and review your account security settings.</p>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${this.appName}. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
                Suspicious activity detected - ${this.appName}
                
                Security Alert: We detected suspicious activity on your account.
                
                Hello,
                
                We detected unusual activity on your account:
                Activity: ${activity}
                IP Address: ${ipAddress}
                Time: ${time}
                
                If this wasn't you, please change your password immediately.
            `,
        };
    }
}

