import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';

describe('PasswordHasher', () => {
  describe('hash', () => {
    it('should hash a valid password', async () => {
      const password = 'SecurePass123!';
      const hash = await PasswordHasher.hash(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
      expect(hash).toContain('$argon2id$'); // Argon2id format
    });

    it('should produce different hashes for same password (salt)', async () => {
      const password = 'SecurePass123!';
      const hash1 = await PasswordHasher.hash(password);
      const hash2 = await PasswordHasher.hash(password);

      expect(hash1).not.toBe(hash2); // Different salts
    });

    it('should trim password before hashing', async () => {
      const password = '  SecurePass123!  ';
      const hash1 = await PasswordHasher.hash(password);
      const hash2 = await PasswordHasher.hash('SecurePass123!');

      // Both should verify the trimmed password
      const isValid1 = await PasswordHasher.verify(hash1, 'SecurePass123!');
      const isValid2 = await PasswordHasher.verify(hash2, 'SecurePass123!');

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });

    it('should reject empty password', async () => {
      await expect(PasswordHasher.hash('')).rejects.toThrow('Password cannot be empty');
    });

    it('should reject password with only spaces', async () => {
      await expect(PasswordHasher.hash('   ')).rejects.toThrow('Password cannot be empty');
      await expect(PasswordHasher.hash('\t')).rejects.toThrow('Password cannot be empty');
      await expect(PasswordHasher.hash('\n')).rejects.toThrow('Password cannot be empty');
    });

    it('should reject password shorter than 8 characters', async () => {
      await expect(PasswordHasher.hash('Pass1!')).rejects.toThrow('at least 8 characters');
      await expect(PasswordHasher.hash('Pass12')).rejects.toThrow('at least 8 characters');
      await expect(PasswordHasher.hash('Pass1')).rejects.toThrow('at least 8 characters');
    });

    it('should reject password longer than 100 characters', async () => {
      const longPassword = 'A'.repeat(101) + '1!';
      await expect(PasswordHasher.hash(longPassword)).rejects.toThrow('at most 100 characters');
    });

    it('should accept password with exactly 8 characters', async () => {
      const password = 'Pass123!';
      const hash = await PasswordHasher.hash(password);
      expect(hash).toBeDefined();
    });

    it('should accept password with exactly 100 characters', async () => {
      const password = 'A'.repeat(98) + '1!';
      const hash = await PasswordHasher.hash(password);
      expect(hash).toBeDefined();
    });

    it('should handle special characters in password', async () => {
      const passwords = [
        'Password123@',
        'Password123$',
        'Password123!',
        'Password123%',
        'Password123*',
        'Password123?',
        'Password123&',
      ];

      for (const password of passwords) {
        const hash = await PasswordHasher.hash(password);
        expect(hash).toBeDefined();
        const isValid = await PasswordHasher.verify(hash, password);
        expect(isValid).toBe(true);
      }
    });

    it('should handle unicode characters', async () => {
      const password = 'Password123!ñ';
      const hash = await PasswordHasher.hash(password);
      const isValid = await PasswordHasher.verify(hash, password);
      expect(isValid).toBe(true);
    });
  });

  describe('verify', () => {
    it('should verify correct password', async () => {
      const password = 'SecurePass123!';
      const hash = await PasswordHasher.hash(password);
      const isValid = await PasswordHasher.verify(hash, password);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePass123!';
      const hash = await PasswordHasher.hash(password);
      const isValid = await PasswordHasher.verify(hash, 'WrongPassword123!');

      expect(isValid).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await PasswordHasher.hash('SecurePass123!');
      const isValid = await PasswordHasher.verify(hash, '');

      expect(isValid).toBe(false);
    });

    it('should return false for null/undefined password', async () => {
      const hash = await PasswordHasher.hash('SecurePass123!');
      
      // @ts-ignore - Testing invalid input
      expect(await PasswordHasher.verify(hash, null)).toBe(false);
      // @ts-ignore - Testing invalid input
      expect(await PasswordHasher.verify(hash, undefined)).toBe(false);
    });

    it('should return false for empty hash', async () => {
      // @ts-ignore - Testing invalid input
      expect(await PasswordHasher.verify('', 'SecurePass123!')).toBe(false);
    });

    it('should trim password before verification', async () => {
      const password = 'SecurePass123!';
      const hash = await PasswordHasher.hash(password);
      
      const isValid1 = await PasswordHasher.verify(hash, '  SecurePass123!  ');
      const isValid2 = await PasswordHasher.verify(hash, 'SecurePass123!');

      expect(isValid1).toBe(true);
      expect(isValid2).toBe(true);
    });

    it('should return false for password with only spaces', async () => {
      const hash = await PasswordHasher.hash('SecurePass123!');
      
      expect(await PasswordHasher.verify(hash, '   ')).toBe(false);
      expect(await PasswordHasher.verify(hash, '\t')).toBe(false);
      expect(await PasswordHasher.verify(hash, '\n')).toBe(false);
    });

    it('should handle case-sensitive passwords', async () => {
      const password = 'SecurePass123!';
      const hash = await PasswordHasher.hash(password);
      
      expect(await PasswordHasher.verify(hash, 'securepass123!')).toBe(false);
      expect(await PasswordHasher.verify(hash, 'SECUREPASS123!')).toBe(false);
      expect(await PasswordHasher.verify(hash, 'SecurePass123!')).toBe(true);
    });

    it('should handle similar but different passwords', async () => {
      const password1 = 'SecurePass123!';
      const password2 = 'SecurePass124!'; // One digit different
      const hash1 = await PasswordHasher.hash(password1);
      const hash2 = await PasswordHasher.hash(password2);

      expect(await PasswordHasher.verify(hash1, password1)).toBe(true);
      expect(await PasswordHasher.verify(hash1, password2)).toBe(false);
      expect(await PasswordHasher.verify(hash2, password1)).toBe(false);
      expect(await PasswordHasher.verify(hash2, password2)).toBe(true);
    });

    it('should handle invalid hash format gracefully', async () => {
      const invalidHash = 'not-a-valid-hash';
      const isValid = await PasswordHasher.verify(invalidHash, 'SecurePass123!');

      expect(isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle very long valid password (100 chars)', async () => {
      const password = 'A'.repeat(98) + '1!';
      const hash = await PasswordHasher.hash(password);
      const isValid = await PasswordHasher.verify(hash, password);

      expect(isValid).toBe(true);
    });

    it('should handle password with all special characters', async () => {
      const password = 'Pass123@$!%*?&';
      const hash = await PasswordHasher.hash(password);
      const isValid = await PasswordHasher.verify(hash, password);

      expect(isValid).toBe(true);
    });

    it('should handle password with mixed case and numbers', async () => {
      const password = 'PaSsWoRd123!';
      const hash = await PasswordHasher.hash(password);
      const isValid = await PasswordHasher.verify(hash, password);

      expect(isValid).toBe(true);
    });
  });
});

