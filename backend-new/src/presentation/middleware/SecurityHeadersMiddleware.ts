import { Request, Response, NextFunction } from 'express';

export function securityHeadersMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy
    const csp = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join('; ');

    res.setHeader('Content-Security-Policy', csp);

    // Permissions Policy (formerly Feature Policy)
    res.setHeader(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()'
    );

    // HSTS (only in production with HTTPS)
    if (process.env.NODE_ENV === 'production' && req.secure) {
        res.setHeader(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload'
        );
    }

    // Remove server header (security through obscurity)
    res.removeHeader('X-Powered-By');

    next();
}


