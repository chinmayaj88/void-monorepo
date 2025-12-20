import { Request, Response, NextFunction } from 'express';
import { createHash, randomBytes } from 'crypto';
import { logger } from '@infrastructure/config/Logger';

// Store CSRF tokens in memory (in production, use Redis or session store)
const csrfTokens = new Map<string, { token: string; expiresAt: Date }>();

// Clean up expired tokens every hour
setInterval(() => {
    const now = new Date();
    for (const [key, value] of csrfTokens.entries()) {
        if (value.expiresAt < now) {
            csrfTokens.delete(key);
        }
    }
}, 60 * 60 * 1000);

export function generateCsrfToken(req: Request): string {
    const sessionId = req.headers['x-session-id'] || req.ip || 'anonymous';
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    csrfTokens.set(sessionId, { token, expiresAt });
    return token;
}

export function validateCsrfToken(req: Request, res: Response, next: NextFunction): void {
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    const sessionId = req.headers['x-session-id'] || req.ip || 'anonymous';
    const token = req.headers['x-csrf-token'] as string;

    if (!token) {
        res.status(403).json({
            error: 'CSRF token required',
        });
        return;
    }

    const stored = csrfTokens.get(sessionId);
    if (!stored || stored.token !== token) {
        logger.warn('CSRF token validation failed', {
            sessionId,
            ip: req.ip,
        });
        res.status(403).json({
            error: 'Invalid CSRF token',
        });
        return;
    }

    // Check if token is expired
    if (stored.expiresAt < new Date()) {
        csrfTokens.delete(sessionId);
        res.status(403).json({
            error: 'CSRF token expired',
        });
        return;
    }

    next();
}

// Middleware to add CSRF token to response headers for GET requests
export function csrfTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
    if (req.method === 'GET' && !req.path.startsWith('/api/auth/login') && !req.path.startsWith('/api/auth/register')) {
        const token = generateCsrfToken(req);
        res.setHeader('X-CSRF-Token', token);
    }
    next();
}

