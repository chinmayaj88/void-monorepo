import { User } from '@domain/entities/User';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';

describe('User Entity', () => {
  const validUserId = UserId.create('user-123');
  const validEmail = Email.create('test@example.com');
  const validPasswordHash = 'valid-password-hash';
  const validTotpSecret = 'valid-totp-secret';

  describe('create', () => {
    it('should create a valid user', () => {
      const user = User.create(validUserId, validEmail, validPasswordHash, validTotpSecret);
      
      expect(user.getId()).toEqual(validUserId);
      expect(user.getEmail()).toEqual(validEmail);
      expect(user.getPasswordHash()).toBe(validPasswordHash);
      expect(user.getTotpSecret()).toBe(validTotpSecret);
      expect(user.getCreatedAt()).toBeInstanceOf(Date);
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
    });

    it('should set createdAt and updatedAt to current time', () => {
      const before = new Date();
      const user = User.create(validUserId, validEmail, validPasswordHash, validTotpSecret);
      const after = new Date();

      expect(user.getCreatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.getCreatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
      expect(user.getUpdatedAt().getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.getUpdatedAt().getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should throw error for empty password hash', () => {
      expect(() => {
        User.create(validUserId, validEmail, '', validTotpSecret);
      }).toThrow('Password hash cannot be empty');

      expect(() => {
        User.create(validUserId, validEmail, '   ', validTotpSecret);
      }).toThrow('Password hash cannot be empty');
    });

    it('should throw error for empty TOTP secret', () => {
      expect(() => {
        User.create(validUserId, validEmail, validPasswordHash, '');
      }).toThrow('TOTP secret cannot be empty');

      expect(() => {
        User.create(validUserId, validEmail, validPasswordHash, '   ');
      }).toThrow('TOTP secret cannot be empty');
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute user from database', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');
      
      const user = User.reconstitute(
        validUserId,
        validEmail,
        validPasswordHash,
        validTotpSecret,
        createdAt,
        updatedAt
      );

      expect(user.getId()).toEqual(validUserId);
      expect(user.getEmail()).toEqual(validEmail);
      expect(user.getPasswordHash()).toBe(validPasswordHash);
      expect(user.getTotpSecret()).toBe(validTotpSecret);
      expect(user.getCreatedAt()).toEqual(createdAt);
      expect(user.getUpdatedAt()).toEqual(updatedAt);
    });

    it('should throw error for empty password hash', () => {
      expect(() => {
        User.reconstitute(validUserId, validEmail, '', validTotpSecret, new Date(), new Date());
      }).toThrow('Password hash cannot be empty');
    });

    it('should throw error for empty TOTP secret', () => {
      expect(() => {
        User.reconstitute(validUserId, validEmail, validPasswordHash, '', new Date(), new Date());
      }).toThrow('TOTP secret cannot be empty');
    });
  });

  describe('updateEmail', () => {
    it('should update email and updatedAt', () => {
      const user = User.create(validUserId, validEmail, validPasswordHash, validTotpSecret);
      const originalUpdatedAt = user.getUpdatedAt();
      const newEmail = Email.create('new@example.com');

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        user.updateEmail(newEmail);
        expect(user.getEmail()).toEqual(newEmail);
        expect(user.getUpdatedAt().getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });
  });

  describe('updatePassword', () => {
    it('should update password hash and updatedAt', () => {
      const user = User.create(validUserId, validEmail, validPasswordHash, validTotpSecret);
      const originalUpdatedAt = user.getUpdatedAt();
      const newPasswordHash = 'new-password-hash';

      // Wait a bit to ensure timestamp difference
      setTimeout(() => {
        user.updatePassword(newPasswordHash);
        expect(user.getPasswordHash()).toBe(newPasswordHash);
        expect(user.getUpdatedAt().getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
      }, 10);
    });

    it('should throw error for empty password hash', () => {
      const user = User.create(validUserId, validEmail, validPasswordHash, validTotpSecret);

      expect(() => {
        user.updatePassword('');
      }).toThrow('Password hash cannot be empty');

      expect(() => {
        user.updatePassword('   ');
      }).toThrow('Password hash cannot be empty');
    });
  });

  describe('equals', () => {
    it('should return true for same user ID', () => {
      const user1 = User.create(validUserId, validEmail, validPasswordHash, validTotpSecret);
      const user2 = User.create(validUserId, Email.create('other@example.com'), 'other-hash', 'other-secret');
      
      expect(user1.equals(user2)).toBe(true);
    });

    it('should return false for different user IDs', () => {
      const user1 = User.create(validUserId, validEmail, validPasswordHash, validTotpSecret);
      const user2 = User.create(UserId.create('other-id'), validEmail, validPasswordHash, validTotpSecret);
      
      expect(user1.equals(user2)).toBe(false);
    });
  });

  describe('getters', () => {
    it('should return correct values', () => {
      const user = User.create(validUserId, validEmail, validPasswordHash, validTotpSecret);

      expect(user.getId()).toEqual(validUserId);
      expect(user.getEmail()).toEqual(validEmail);
      expect(user.getPasswordHash()).toBe(validPasswordHash);
      expect(user.getTotpSecret()).toBe(validTotpSecret);
      expect(user.getCreatedAt()).toBeInstanceOf(Date);
      expect(user.getUpdatedAt()).toBeInstanceOf(Date);
    });
  });
});

