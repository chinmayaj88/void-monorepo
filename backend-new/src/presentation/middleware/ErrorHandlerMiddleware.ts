import { Request, Response, NextFunction } from 'express';
import { DomainError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export function errorHandlerMiddleware(
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    if (res.headersSent) {
        return next(error);
    }

    logger.error('Request error', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
    });

    if (error instanceof DomainError) {
        res.status(400).json({
            error: error.message,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    // Default error response
    res.status(500).json({
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
    });
}

