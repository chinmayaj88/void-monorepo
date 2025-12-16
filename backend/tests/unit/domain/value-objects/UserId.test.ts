import { UserId } from '@domain/value-objects/UserId';

describe('UserId Value Object', () => {
  describe('create', () => {
    it('should create a valid user ID', () => {
      const userId = UserId.create('123e4567-e89b-12d3-a456-426614174000');
      expect(userId.toString()).toBe('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should accept any non-empty string', () => {
      const userId = UserId.create('user-123');
      expect(userId.toString()).toBe('user-123');
    });

    it('should throw error for empty string', () => {
      expect(() => UserId.create('')).toThrow('UserId cannot be empty');
    });

    it('should throw error for whitespace-only string', () => {
      expect(() => UserId.create('   ')).toThrow('UserId cannot be empty');
      expect(() => UserId.create('\t')).toThrow('UserId cannot be empty');
      expect(() => UserId.create('\n')).toThrow('UserId cannot be empty');
    });

    it('should accept string with leading/trailing spaces (but not empty after trim)', () => {
      const userId = UserId.create('  user-123  ');
      expect(userId.toString()).toBe('  user-123  '); // Preserves spaces
    });
  });

  describe('fromString', () => {
    it('should create user ID from string', () => {
      const userId = UserId.fromString('user-123');
      expect(userId.toString()).toBe('user-123');
    });

    it('should behave same as create', () => {
      const userId1 = UserId.create('user-123');
      const userId2 = UserId.fromString('user-123');
      expect(userId1.toString()).toBe(userId2.toString());
    });
  });

  describe('equals', () => {
    it('should return true for same user IDs', () => {
      const userId1 = UserId.create('user-123');
      const userId2 = UserId.create('user-123');
      expect(userId1.equals(userId2)).toBe(true);
    });

    it('should return false for different user IDs', () => {
      const userId1 = UserId.create('user-123');
      const userId2 = UserId.create('user-456');
      expect(userId1.equals(userId2)).toBe(false);
    });

    it('should be case sensitive', () => {
      const userId1 = UserId.create('user-123');
      const userId2 = UserId.create('USER-123');
      expect(userId1.equals(userId2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the user ID string', () => {
      const userId = UserId.create('user-123');
      expect(userId.toString()).toBe('user-123');
    });
  });
});

