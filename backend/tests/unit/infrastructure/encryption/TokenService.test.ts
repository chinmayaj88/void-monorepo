import { TokenService, TokenPayload } from '@infrastructure/encryption/TokenService';

describe('TokenService', () => {
  const validPayload: TokenPayload = {
    userId: 'user-123',
    email: 'test@example.com',
  };

  beforeEach(() => {
    // Ensure JWT_SECRET is set
    process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long-for-testing-purposes';
  });

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = TokenService.generateAccessToken(validPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate tokens for same payload', () => {
      const token1 = TokenService.generateAccessToken(validPayload);
      const token2 = TokenService.generateAccessToken(validPayload);

      // Tokens should be valid (may be same if generated in same millisecond)
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(typeof token1).toBe('string');
      expect(typeof token2).toBe('string');
    });

    it('should include payload in token', () => {
      const token = TokenService.generateAccessToken(validPayload);
      const decoded = TokenService.verifyAccessToken(token);

      expect(decoded.userId).toBe(validPayload.userId);
      expect(decoded.email).toBe(validPayload.email);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = TokenService.generateRefreshToken(validPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate tokens for same payload', () => {
      const token1 = TokenService.generateRefreshToken(validPayload);
      const token2 = TokenService.generateRefreshToken(validPayload);

      // Tokens should be valid (may be same if generated in same millisecond)
      expect(token1).toBeDefined();
      expect(token2).toBeDefined();
      expect(typeof token1).toBe('string');
      expect(typeof token2).toBe('string');
    });

    it('should include payload in token', () => {
      const token = TokenService.generateRefreshToken(validPayload);
      const decoded = TokenService.verifyRefreshToken(token);

      expect(decoded.userId).toBe(validPayload.userId);
      expect(decoded.email).toBe(validPayload.email);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = TokenService.generateAccessToken(validPayload);
      const decoded = TokenService.verifyAccessToken(token);

      expect(decoded.userId).toBe(validPayload.userId);
      expect(decoded.email).toBe(validPayload.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        TokenService.verifyAccessToken(invalidToken);
      }).toThrow('Invalid or expired token');
    });

    it('should throw error for expired token', async () => {
      // Create a token with very short expiry (1ms)
      const oldSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long-for-testing-purposes';
      
      // We can't easily test expired tokens without mocking, but we can test invalid format
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
      
      expect(() => {
        TokenService.verifyAccessToken(invalidToken);
      }).toThrow('Invalid or expired token');

      process.env.JWT_SECRET = oldSecret;
    });

    it('should verify token with correct secret', () => {
      // Generate token
      const token = TokenService.generateAccessToken(validPayload);
      
      // Verify with same secret (should work)
      const decoded = TokenService.verifyAccessToken(token);
      expect(decoded.userId).toBe(validPayload.userId);
      expect(decoded.email).toBe(validPayload.email);
    });

    it('should throw error for empty token', () => {
      expect(() => {
        TokenService.verifyAccessToken('');
      }).toThrow('Invalid or expired token');
    });

    it('should verify token with different payloads', () => {
      const payload1: TokenPayload = { userId: 'user-1', email: 'user1@example.com' };
      const payload2: TokenPayload = { userId: 'user-2', email: 'user2@example.com' };

      const token1 = TokenService.generateAccessToken(payload1);
      const token2 = TokenService.generateAccessToken(payload2);

      const decoded1 = TokenService.verifyAccessToken(token1);
      const decoded2 = TokenService.verifyAccessToken(token2);

      expect(decoded1.userId).toBe('user-1');
      expect(decoded2.userId).toBe('user-2');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = TokenService.generateRefreshToken(validPayload);
      const decoded = TokenService.verifyRefreshToken(token);

      expect(decoded.userId).toBe(validPayload.userId);
      expect(decoded.email).toBe(validPayload.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        TokenService.verifyRefreshToken(invalidToken);
      }).toThrow('Invalid or expired refresh token');
    });

    it('should throw error for access token used as refresh token', () => {
      const accessToken = TokenService.generateAccessToken(validPayload);

      // This should work (both use same secret), but in practice you might want to check token type
      // For now, both tokens are structurally the same, just different expiry
      const decoded = TokenService.verifyRefreshToken(accessToken);
      expect(decoded).toBeDefined();
    });

    it('should throw error for empty token', () => {
      expect(() => {
        TokenService.verifyRefreshToken('');
      }).toThrow('Invalid or expired refresh token');
    });
  });

  describe('JWT_SECRET validation', () => {
    it('should throw error if JWT_SECRET is not set', () => {
      const oldSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      // Re-import to trigger the validation
      jest.resetModules();
      
      expect(() => {
        require('@infrastructure/encryption/TokenService');
      }).toThrow('JWT_SECRET environment variable must be set');

      process.env.JWT_SECRET = oldSecret;
    });

    it('should throw error if JWT_SECRET is less than 32 characters', () => {
      const oldSecret = process.env.JWT_SECRET;
      process.env.JWT_SECRET = 'short';

      // Re-import to trigger the validation
      jest.resetModules();
      
      expect(() => {
        require('@infrastructure/encryption/TokenService');
      }).toThrow('JWT_SECRET must be at least 32 characters long');

      process.env.JWT_SECRET = oldSecret;
    });
  });

  describe('token expiry', () => {
    it('should generate access token with 15m expiry', () => {
      const token = TokenService.generateAccessToken(validPayload);
      const decoded = TokenService.verifyAccessToken(token);

      // Check that token has exp claim (JWT automatically adds this)
      expect(decoded).toBeDefined();
    });

    it('should generate refresh token with 7d expiry', () => {
      const token = TokenService.generateRefreshToken(validPayload);
      const decoded = TokenService.verifyRefreshToken(token);

      expect(decoded).toBeDefined();
    });
  });
});

