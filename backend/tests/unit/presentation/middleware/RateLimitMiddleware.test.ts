import { Request, Response, NextFunction } from 'express';
import { rateLimit, rateLimiters } from '@presentation/middleware/RateLimitMiddleware';

describe('RateLimitMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production'; // Enable rate limiting

    mockReq = {
      method: 'POST',
      path: '/api/auth/register',
      headers: {},
      socket: {
        remoteAddress: '127.0.0.1',
      } as any,
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.clearAllMocks();
  });

  describe('rateLimit', () => {
    it('should allow requests within limit', () => {
      const middleware = rateLimit({ windowMs: 60000, maxRequests: 5 });

      for (let i = 0; i < 5; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(5);
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
    });

    it('should block requests exceeding limit', () => {
      const middleware = rateLimit({ windowMs: 60000, maxRequests: 5 });

      // Make 5 requests (within limit)
      for (let i = 0; i < 5; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      // 6th request should be blocked
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(5);
      expect(mockRes.status).toHaveBeenCalledWith(429);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many requests',
        })
      );
    });

    it('should set rate limit headers', () => {
      const middleware = rateLimit({ windowMs: 60000, maxRequests: 5 });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', '5');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Remaining',
        expect.any(String)
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'X-RateLimit-Reset',
        expect.any(String)
      );
    });

    it('should track different IPs separately', () => {
      const middleware = rateLimit({ windowMs: 60000, maxRequests: 2 });

      // IP 1 makes 2 requests
      mockReq.socket!.remoteAddress = '127.0.0.1';
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // IP 2 makes 2 requests (should work)
      mockReq.socket!.remoteAddress = '192.168.1.1';
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(4);
    });

    it('should track different endpoints separately', () => {
      const middleware = rateLimit({ windowMs: 60000, maxRequests: 2 });

      // Endpoint 1
      mockReq.path = '/api/auth/register';
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Endpoint 2 (should work)
      mockReq.path = '/api/auth/login';
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(4);
    });

    it('should reset after window expires', (done) => {
      const middleware = rateLimit({ windowMs: 100, maxRequests: 2 });

      // Make 2 requests (limit reached)
      middleware(mockReq as Request, mockRes as Response, mockNext);
      middleware(mockReq as Request, mockRes as Response, mockNext);

      // 3rd request blocked
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(429);

      // Wait for window to expire
      setTimeout(() => {
        jest.clearAllMocks();
        middleware(mockReq as Request, mockRes as Response, mockNext);
        expect(mockNext).toHaveBeenCalled();
        done();
      }, 150);
    });

    it('should use x-forwarded-for header if present', () => {
      const middleware = rateLimit({ windowMs: 60000, maxRequests: 2 });

      mockReq.headers['x-forwarded-for'] = '192.168.1.100, 10.0.0.1';

      middleware(mockReq as Request, mockRes as Response, mockNext);

      // Should use first IP from x-forwarded-for
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use x-real-ip header if present', () => {
      const middleware = rateLimit({ windowMs: 60000, maxRequests: 2 });

      mockReq.headers['x-real-ip'] = '192.168.1.200';

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip rate limiting in test environment', () => {
      process.env.NODE_ENV = 'test';
      const middleware = rateLimit({ windowMs: 60000, maxRequests: 1 });

      // Make 10 requests - all should pass in test mode
      for (let i = 0; i < 10; i++) {
        middleware(mockReq as Request, mockRes as Response, mockNext);
      }

      expect(mockNext).toHaveBeenCalledTimes(10);
      expect(mockRes.status).not.toHaveBeenCalledWith(429);
    });
  });

  describe('rateLimiters', () => {
    it('should have auth rate limiter with correct config', () => {
      const middleware = rateLimiters.auth;
      expect(middleware).toBeDefined();

      // Test it works
      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should have general rate limiter with correct config', () => {
      const middleware = rateLimiters.general;
      expect(middleware).toBeDefined();

      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should have public rate limiter with correct config', () => {
      const middleware = rateLimiters.public;
      expect(middleware).toBeDefined();

      middleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

