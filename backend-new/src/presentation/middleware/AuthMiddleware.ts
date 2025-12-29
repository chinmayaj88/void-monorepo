import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@infrastructure/encryption/TokenService';
import { Container } from '@infrastructure/di/Container';
import { ISessionRepository } from '@application/interfaces/ISessionRepository';
import { IDeviceRepository } from '@application/interfaces/IDeviceRepository';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { UserId } from '@domain/value-objects/UserId';
import { createHash } from 'crypto';
import { logger } from '@infrastructure/config/Logger';

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                role: string;
            };
            deviceId?: string;
        }
    }
}

export function createAuthMiddleware(container: Container) {
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

            // Check session validity
            const sessionRepository = container.resolve<ISessionRepository>('repository.session');
            const accessTokenHash = createHash('sha256').update(token).digest('hex');
            const session = await sessionRepository.findByAccessTokenHash(accessTokenHash);

            if (!session || session.revokedAt) {
                res.status(401).json({
                    error: 'Session has been revoked',
                });
                return;
            }

            // Check device validity if device is linked
            if (session.deviceId) {
                const deviceRepository = container.resolve<IDeviceRepository>('repository.device');
                const device = await deviceRepository.findById(session.deviceId);

                if (!device || device.revokedAt || !device.isVerified) {
                    res.status(401).json({
                        error: 'Device has been revoked or not verified',
                    });
                    return;
                }
            }

            // Check email verification (enforce email verification)
            const userRepository = container.resolve<IUserRepository>('repository.user');
            const user = await userRepository.findById(UserId.fromString(payload.userId));
            
            if (!user || !user.isEmailVerified()) {
                res.status(403).json({
                    error: 'Email verification required. Please verify your email address before accessing this resource.',
                    requiresEmailVerification: true,
                });
                return;
            }

            // Update last activity timestamp
            await sessionRepository.updateLastActivity(session.id);

            req.user = {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
            };
            req.deviceId = session.deviceId || undefined;

            next();
        } catch (error) {
            logger.warn('Auth middleware error', { error: error instanceof Error ? error.message : error });
            res.status(401).json({
                error: 'Invalid or expired token',
            });
        }
    };
}

export function createAdminMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: 'Authentication required',
            });
            return;
        }

        if (req.user.role !== 'admin') {
            res.status(403).json({
                error: 'Admin access required',
            });
            return;
        }

        next();
    };
}

