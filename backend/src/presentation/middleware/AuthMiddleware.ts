import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@infrastructure/encryption/TokenService';
import { ISessionRepository } from '@application/interfaces/ISessionRepository';
import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { logger } from '@infrastructure/config/Logger';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
            };
            deviceId?: string;
        }
    }
}

// Factory function to create auth middleware with dependencies (for future use)
// Currently, device/session revocation is checked in RefreshTokenUseCase
export function createAuthMiddleware(
    _sessionRepository: ISessionRepository,
    _deviceRepository: IDeviceRepository
) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
        } catch (error) {
            logger.warn('Auth middleware error', { error: error instanceof Error ? error.message : error });
            res.status(401).json({
                error: 'Invalid or expired token',
            });
        }
    };
}

// Default auth middleware (for backward compatibility, but won't check device/session)
// Use createAuthMiddleware in production
export async function authMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
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