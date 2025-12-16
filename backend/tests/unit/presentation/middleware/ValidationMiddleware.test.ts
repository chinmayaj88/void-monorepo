import { Request, Response, NextFunction } from 'express';
import { validateBody } from '@presentation/middleware/ValidationMiddleware';
import { z } from 'zod';

describe('ValidationMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
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

  it('should call next() for valid data', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    mockReq.body = {
      email: 'test@example.com',
      password: 'Password123!',
    };

    const middleware = validateBody(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockRes.status).not.toHaveBeenCalled();
  });

  it('should throw ZodError for invalid data', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });

    mockReq.body = {
      email: 'invalid-email',
      password: 'short',
    };

    const middleware = validateBody(schema);

    expect(() => {
      middleware(mockReq as Request, mockRes as Response, mockNext);
    }).toThrow();

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate nested objects', () => {
    const schema = z.object({
      user: z.object({
        name: z.string(),
        age: z.number(),
      }),
    });

    mockReq.body = {
      user: {
        name: 'John',
        age: 30,
      },
    };

    const middleware = validateBody(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should validate arrays', () => {
    const schema = z.object({
      items: z.array(z.string()),
    });

    mockReq.body = {
      items: ['item1', 'item2', 'item3'],
    };

    const middleware = validateBody(schema);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle empty body', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    mockReq.body = {};

    const middleware = validateBody(schema);

    expect(() => {
      middleware(mockReq as Request, mockRes as Response, mockNext);
    }).toThrow();

    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should handle null body', () => {
    const schema = z.object({
      email: z.string().email(),
    });

    mockReq.body = null;

    const middleware = validateBody(schema);

    expect(() => {
      middleware(mockReq as Request, mockRes as Response, mockNext);
    }).toThrow();
  });
});

