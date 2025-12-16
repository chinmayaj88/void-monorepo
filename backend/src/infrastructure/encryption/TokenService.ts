import jwt from 'jsonwebtoken';

export interface TokenPayload {
    userId: string;
    email: string;
}

export class TokenService {
    private static getJwtSecret(): string {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error(
                'JWT_SECRET environment variable must be set. Generate a strong secret (at least 32 characters).'
            );
        }
        if (secret.length < 32) {
            throw new Error(
                'JWT_SECRET must be at least 32 characters long for security. Current length: ' +
                    secret.length
            );
        }
        return secret;
    }

    private static readonly ACCESS_TOKEN_EXPIRES_IN = '15m';
    private static readonly REFRESH_TOKEN_EXPIRES_IN = '7d';
    private static readonly JWT_OPTIONS = {
        issuer: 'void-cloud-drive',
        audience: 'void-cloud-drive-api',
    };

    static generateAccessToken(payload: TokenPayload): string {
        return jwt.sign(payload, this.getJwtSecret(), {
            ...this.JWT_OPTIONS,
            expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
        });
    }

    static generateRefreshToken(payload: TokenPayload): string {
        return jwt.sign(payload, this.getJwtSecret(), {
            ...this.JWT_OPTIONS,
            expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
        });
    }

    static verifyAccessToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, this.getJwtSecret(), this.JWT_OPTIONS) as TokenPayload;
        } catch {
            throw new Error('Invalid or expired token');
        }
    }

    static verifyRefreshToken(token: string): TokenPayload {
        try {
            return jwt.verify(token, this.getJwtSecret(), this.JWT_OPTIONS) as TokenPayload;
        } catch {
            throw new Error('Invalid or expired refresh token');
        }
    }
}