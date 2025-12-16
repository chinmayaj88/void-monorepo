import { Request, Response, NextFunction } from 'express';
import { securityMiddleware } from '@presentation/middleware/SecurityMiddleware';

describe('SecurityMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;

    mockReq = {};

    mockRes = {
      setHeader: jest.fn().mockReturnThis(),
      removeHeader: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  it('should set X-Content-Type-Options header', () => {
    securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
  });

  it('should set X-Frame-Options header', () => {
    securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
  });

  it('should set X-XSS-Protection header', () => {
    securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
  });

  it('should set Referrer-Policy header', () => {
    securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Referrer-Policy',
      'strict-origin-when-cross-origin'
    );
  });

  it('should set Content-Security-Policy header', () => {
    securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
    );
  });

  it('should set Permissions-Policy header', () => {
    securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );
  });

  it('should remove X-Powered-By header', () => {
    securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.removeHeader).toHaveBeenCalledWith('X-Powered-By');
  });

  it('should set Strict-Transport-Security in production', () => {
    process.env.NODE_ENV = 'production';

    securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).toHaveBeenCalledWith(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  });

  it('should not set Strict-Transport-Security in non-production', () => {
    process.env.NODE_ENV = 'development';

    securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.setHeader).not.toHaveBeenCalledWith(
      'Strict-Transport-Security',
      expect.any(String)
    );
  });

  it('should call next()', () => {
    securityMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });
});

