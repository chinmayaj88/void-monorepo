import { Request, Response, NextFunction } from 'express';
import { errorHandlerMiddleware } from '@presentation/middleware/ErrorHandlerMiddleware';
import { DomainError, InvalidCredentialsError, EmailAlreadyExistsError, InvalidTotpCodeError, InvalidEmailError, UserNotFoundError } from '@domain/errors/DomainError';
import { ZodError } from 'zod';

describe('ErrorHandlerMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;

    mockReq = {
      url: '/api/auth/register',
      method: 'POST',
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  describe('ZodError handling', () => {
    it('should handle Zod validation errors with 400 status', () => {
      const zodError = new ZodError([
        {
          path: ['email'],
          message: 'Invalid email',
          code: 'invalid_string',
        },
        {
          path: ['password'],
          message: 'Password too short',
          code: 'too_small',
        },
      ]);

      errorHandlerMiddleware(zodError, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Validation error',
          details: expect.arrayContaining([
            expect.objectContaining({ path: 'email', message: 'Invalid email' }),
            expect.objectContaining({ path: 'password', message: 'Password too short' }),
          ]),
        })
      );
    });
  });

  describe('DomainError handling', () => {
    it('should handle InvalidCredentialsError with 401 status', () => {
      const error = new InvalidCredentialsError();

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it('should handle InvalidTotpCodeError with 401 status', () => {
      const error = new InvalidTotpCodeError();

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle InvalidEmailError with 400 status', () => {
      const error = new InvalidEmailError('invalid@email');

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should handle EmailAlreadyExistsError with 409 status', () => {
      const error = new EmailAlreadyExistsError('test@example.com');

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
    });

    it('should handle UserNotFoundError with 404 status', () => {
      const error = new UserNotFoundError('user-123');

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });
  });

  describe('Token error handling', () => {
    it('should handle token-related errors with 401 status', () => {
      const error = new Error('Invalid token');

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Invalid or expired token',
        })
      );
    });

    it('should handle Token-related errors (case insensitive)', () => {
      const error = new Error('Token expired');

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('Unexpected error handling', () => {
    it('should handle unexpected errors with 500 status', () => {
      const error = new Error('Database connection failed');

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
        })
      );
    });

    it('should include error details in development mode', () => {
      process.env.NODE_ENV = 'development';
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          details: expect.objectContaining({
            message: 'Test error',
            stack: 'Error stack trace',
          }),
        })
      );
    });

    it('should not include error details in production mode', () => {
      process.env.NODE_ENV = 'production';
      const error = new Error('Test error');
      error.stack = 'Error stack trace';

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Internal server error',
          details: undefined,
        })
      );
    });

    it('should log error details', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const error = new Error('Test error');

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Unexpected error:',
        expect.objectContaining({
          message: 'Test error',
          url: '/api/auth/register',
          method: 'POST',
        })
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error response format', () => {
    it('should include timestamp in error response', () => {
      const error = new Error('Test error');

      errorHandlerMiddleware(error, mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: expect.any(String),
        })
      );
    });
  });
});

