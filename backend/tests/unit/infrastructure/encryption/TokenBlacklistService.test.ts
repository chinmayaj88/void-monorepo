import { TokenBlacklistService } from '@infrastructure/encryption/TokenBlacklistService';
import { TokenService } from '@infrastructure/encryption/TokenService';

describe('TokenBlacklistService', () => {
  beforeEach(() => {
    TokenBlacklistService.clear();
  });

  afterEach(() => {
    TokenBlacklistService.clear();
  });

  describe('add', () => {
    it('should add token to blacklist', () => {
      const token = 'test-token-123';
      const expiresAt = Date.now() + 10000;

      TokenBlacklistService.add(token, expiresAt);

      expect(TokenBlacklistService.isBlacklisted(token)).toBe(true);
    });

    it('should handle multiple tokens', () => {
      const token1 = 'token-1';
      const token2 = 'token-2';
      const expiresAt = Date.now() + 10000;

      TokenBlacklistService.add(token1, expiresAt);
      TokenBlacklistService.add(token2, expiresAt);

      expect(TokenBlacklistService.isBlacklisted(token1)).toBe(true);
      expect(TokenBlacklistService.isBlacklisted(token2)).toBe(true);
    });

    it('should auto-remove expired tokens', (done) => {
      const token = 'expired-token';
      const expiresAt = Date.now() + 100; // Expires in 100ms

      TokenBlacklistService.add(token, expiresAt);

      expect(TokenBlacklistService.isBlacklisted(token)).toBe(true);

      setTimeout(() => {
        expect(TokenBlacklistService.isBlacklisted(token)).toBe(false);
        done();
      }, 150);
    });
  });

  describe('isBlacklisted', () => {
    it('should return false for non-blacklisted token', () => {
      expect(TokenBlacklistService.isBlacklisted('non-existent-token')).toBe(false);
    });

    it('should return true for blacklisted token', () => {
      const token = 'blacklisted-token';
      const expiresAt = Date.now() + 10000;

      TokenBlacklistService.add(token, expiresAt);

      expect(TokenBlacklistService.isBlacklisted(token)).toBe(true);
    });

    it('should return false for expired token', () => {
      const token = 'expired-token';
      const expiresAt = Date.now() - 1000; // Already expired

      TokenBlacklistService.add(token, expiresAt);

      expect(TokenBlacklistService.isBlacklisted(token)).toBe(false);
    });

    it('should remove expired token when checking', () => {
      const token = 'expired-token';
      const expiresAt = Date.now() - 1000;

      TokenBlacklistService.add(token, expiresAt);
      TokenBlacklistService.isBlacklisted(token); // Should remove it

      expect(TokenBlacklistService.size()).toBe(0);
    });
  });

  describe('remove', () => {
    it('should remove token from blacklist', () => {
      const token = 'token-to-remove';
      const expiresAt = Date.now() + 10000;

      TokenBlacklistService.add(token, expiresAt);
      expect(TokenBlacklistService.isBlacklisted(token)).toBe(true);

      TokenBlacklistService.remove(token);
      expect(TokenBlacklistService.isBlacklisted(token)).toBe(false);
    });

    it('should not throw error when removing non-existent token', () => {
      expect(() => {
        TokenBlacklistService.remove('non-existent-token');
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all tokens', () => {
      const expiresAt = Date.now() + 10000;

      TokenBlacklistService.add('token-1', expiresAt);
      TokenBlacklistService.add('token-2', expiresAt);
      TokenBlacklistService.add('token-3', expiresAt);

      expect(TokenBlacklistService.size()).toBe(3);

      TokenBlacklistService.clear();

      expect(TokenBlacklistService.size()).toBe(0);
      expect(TokenBlacklistService.isBlacklisted('token-1')).toBe(false);
      expect(TokenBlacklistService.isBlacklisted('token-2')).toBe(false);
      expect(TokenBlacklistService.isBlacklisted('token-3')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return correct size', () => {
      const expiresAt = Date.now() + 10000;

      expect(TokenBlacklistService.size()).toBe(0);

      TokenBlacklistService.add('token-1', expiresAt);
      expect(TokenBlacklistService.size()).toBe(1);

      TokenBlacklistService.add('token-2', expiresAt);
      expect(TokenBlacklistService.size()).toBe(2);

      TokenBlacklistService.remove('token-1');
      expect(TokenBlacklistService.size()).toBe(1);
    });
  });

  describe('integration with TokenService', () => {
    it('should blacklist refresh tokens correctly', () => {
      const payload = { userId: 'user-123', email: 'test@example.com' };
      const refreshToken = TokenService.generateRefreshToken(payload);
      const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days

      TokenBlacklistService.add(refreshToken, expiresAt);

      expect(TokenBlacklistService.isBlacklisted(refreshToken)).toBe(true);
    });
  });
});

