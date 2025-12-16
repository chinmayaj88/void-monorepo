import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@infrastructure/encryption/TokenService';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
            };
        }
    }
}

export function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): void {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Authorization token required',
            });
            return;
        }

        const token = authHeader.substring(7);

        const payload = TokenService.verifyAccessToken(token);

        req.user = {
            userId: payload.userId,
            email: payload.email,
        };

        next();
    } catch {
        res.status(401).json({
            error: 'Invalid or expired token',
        });
    }
}