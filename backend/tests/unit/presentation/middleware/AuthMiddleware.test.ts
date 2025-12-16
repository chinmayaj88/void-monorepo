import { Request, Response, NextFunction } from 'express';
import { authMiddleware } from '@presentation/middleware/AuthMiddleware';
import { TokenService } from '@infrastructure/encryption/TokenService';

describe('AuthMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow request with valid token', () => {
    const token = TokenService.generateAccessToken({
      userId: 'user-123',
      email: 'test@example.com',
    });

    mockReq.headers.authorization = `Bearer ${token}`;

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual({
      userId: 'user-123',
      email: 'test@example.com',
    });
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should reject request without authorization header', () => {
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Authorization token required',
    });
  });

  it('should reject request with empty authorization header', () => {
    mockReq.headers.authorization = '';

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('should reject request without Bearer prefix', () => {
    mockReq.headers.authorization = 'InvalidToken';

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('should reject request with invalid token', () => {
    mockReq.headers.authorization = 'Bearer invalid-token';

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Invalid or expired token',
    });
  });

  it('should extract token correctly from Bearer header', () => {
    const token = TokenService.generateAccessToken({
      userId: 'user-123',
      email: 'test@example.com',
    });

    mockReq.headers.authorization = `Bearer ${token}`;

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user?.userId).toBe('user-123');
  });

  it('should handle token with extra spaces', () => {
    const token = TokenService.generateAccessToken({
      userId: 'user-123',
      email: 'test@example.com',
    });

    mockReq.headers.authorization = `Bearer  ${token}  `;

    // Should still work (substring(7) handles this)
    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should set user info on request object', () => {
    const token = TokenService.generateAccessToken({
      userId: 'user-456',
      email: 'another@example.com',
    });

    mockReq.headers.authorization = `Bearer ${token}`;

    authMiddleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockReq.user).toBeDefined();
    expect(mockReq.user?.userId).toBe('user-456');
    expect(mockReq.user?.email).toBe('another@example.com');
  });
});

