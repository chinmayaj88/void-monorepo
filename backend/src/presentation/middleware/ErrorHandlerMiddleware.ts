import { Request, Response, NextFunction } from 'express';
import { DomainError } from '@domain/errors/DomainError';
import { ZodError } from 'zod';
import { logger } from '@infrastructure/config/Logger';

interface ErrorResponse {
  error: string;
  details?: unknown;
  timestamp: string;
}

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

const createErrorResponse = (error: string, details?: unknown): ErrorResponse => {
  const response: ErrorResponse = {
    error,
    timestamp: new Date().toISOString(),
  };
  if (details) {
    response.details = details;
  }
  return response;
};

export function errorHandlerMiddleware(
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (error instanceof ZodError) {
    res.status(400).json(
      createErrorResponse('Validation error', error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      })))
    );
    return;
  }

  if (error instanceof DomainError) {
    const statusCode = getStatusCodeForDomainError(error);
    logger.warn(`Domain error [${error.constructor.name}]:`, error.message);
    res.status(statusCode).json(createErrorResponse(error.message));
    return;
  }

  if (error.message.includes('token') || error.message.includes('Token')) {
    res.status(401).json(createErrorResponse('Invalid or expired token'));
    return;
  }

  logger.error('Unexpected error', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  const details =
    process.env.NODE_ENV === 'development'
      ? { message: error.message, stack: error.stack }
      : undefined;

  res.status(500).json(createErrorResponse('Internal server error', details));
}

function getStatusCodeForDomainError(error: DomainError): number {
  const errorName = error.constructor.name;

  // 400 Bad Request - Invalid input
  if (errorName === 'InvalidEmailError') {
    return 400;
  }

  // 401 Unauthorized - Authentication required
  if (
    errorName === 'InvalidCredentialsError' ||
    errorName === 'InvalidTotpCodeError' ||
    errorName === 'UnauthorizedError'
  ) {
    return 401;
  }

  // 404 Not Found - Resource doesn't exist
  if (
    errorName === 'UserNotFoundError' ||
    errorName === 'FileNotFoundError'
  ) {
    return 404;
  }

  // 409 Conflict - Resource already exists
  if (errorName === 'EmailAlreadyExistsError') {
    return 409;
  }

  // Default to 400 for unknown domain errors
  return 400;
}
