import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@infrastructure/encryption/TokenService';

export function optionalAuthMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction
): void {
    const authHeader = req.headers.authorization;

    // If Authorization header is present, try to validate it
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.substring(7);
            const payload = TokenService.verifyAccessToken(token);

            // Set user if token is valid
            req.user = {
                userId: payload.userId,
                email: payload.email,
            };
        } catch {
            // Invalid token, but continue without user (for share token access)
            // Don't set req.user, let it remain undefined
        }
    }

    // Always continue to next middleware/controller
    // This allows both authenticated and unauthenticated access
    next();
}

