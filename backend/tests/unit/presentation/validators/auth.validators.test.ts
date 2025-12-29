import {
  registerSchema,
  loginSchema,
  verifyTotpSchema,
  refreshTokenSchema,
  logoutSchema,
} from '@presentation/http/validators/auth.validators';

describe('Auth Validators', () => {
  describe('registerSchema', () => {
    it('should accept valid registration data', () => {
      const valid = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      expect(() => registerSchema.parse(valid)).not.toThrow();
      const result = registerSchema.parse(valid);
      expect(result.email).toBe('test@example.com');
      expect(result.password).toBe('SecurePass123!');
    });

    it('should trim password', () => {
      const data = {
        email: 'test@example.com',
        password: '  SecurePass123!  ',
      };

      const result = registerSchema.parse(data);
      expect(result.password).toBe('SecurePass123!');
    });

    describe('email validation', () => {
      it('should reject invalid email format', () => {
        const invalid = {
          email: 'invalid-email',
          password: 'SecurePass123!',
        };

        expect(() => registerSchema.parse(invalid)).toThrow('Invalid email format');
      });

      it('should reject empty email', () => {
        const invalid = {
          email: '',
          password: 'SecurePass123!',
        };

        expect(() => registerSchema.parse(invalid)).toThrow('Email is required');
      });

      it('should reject email longer than 255 characters', () => {
        const longEmail = 'a'.repeat(250) + '@example.com';
        const invalid = {
          email: longEmail,
          password: 'SecurePass123!',
        };

        expect(() => registerSchema.parse(invalid)).toThrow('Email is too long');
      });
    });

    describe('password validation - length', () => {
      it('should reject password shorter than 8 characters', () => {
        const invalid = {
          email: 'test@example.com',
          password: 'Pass1!',
        };

        expect(() => registerSchema.parse(invalid)).toThrow('at least 8 characters');
      });

      it('should reject password longer than 100 characters', () => {
        const longPassword = 'A'.repeat(101) + '1!';
        const invalid = {
          email: 'test@example.com',
          password: longPassword,
        };

        expect(() => registerSchema.parse(invalid)).toThrow('at most 100 characters');
      });

      it('should accept password with exactly 8 characters', () => {
        const valid = {
          email: 'test@example.com',
          password: 'Pass123!',
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });

      it('should accept password with exactly 100 characters', () => {
        const valid = {
          email: 'test@example.com',
          password: 'A'.repeat(96) + 'a1!', // Mix of uppercase, lowercase, number, special char
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });
    });

    describe('password validation - complexity requirements', () => {
      it('should reject password without lowercase letter', () => {
        const invalid = {
          email: 'test@example.com',
          password: 'PASSWORD123!',
        };

        expect(() => registerSchema.parse(invalid)).toThrow('lowercase letter');
      });

      it('should reject password without uppercase letter', () => {
        const invalid = {
          email: 'test@example.com',
          password: 'password123!',
        };

        expect(() => registerSchema.parse(invalid)).toThrow('uppercase letter');
      });

      it('should reject password without number', () => {
        const invalid = {
          email: 'test@example.com',
          password: 'Password!',
        };

        expect(() => registerSchema.parse(invalid)).toThrow('number');
      });

      it('should reject password without special character', () => {
        const invalid = {
          email: 'test@example.com',
          password: 'Password123',
        };

        expect(() => registerSchema.parse(invalid)).toThrow('special character');
      });

      it('should accept password with @ special character', () => {
        const valid = {
          email: 'test@example.com',
          password: 'Password123@',
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });

      it('should accept password with $ special character', () => {
        const valid = {
          email: 'test@example.com',
          password: 'Password123$',
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });

      it('should accept password with ! special character', () => {
        const valid = {
          email: 'test@example.com',
          password: 'Password123!',
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });

      it('should accept password with % special character', () => {
        const valid = {
          email: 'test@example.com',
          password: 'Password123%',
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });

      it('should accept password with * special character', () => {
        const valid = {
          email: 'test@example.com',
          password: 'Password123*',
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });

      it('should accept password with ? special character', () => {
        const valid = {
          email: 'test@example.com',
          password: 'Password123?',
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });

      it('should accept password with & special character', () => {
        const valid = {
          email: 'test@example.com',
          password: 'Password123&',
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });

      it('should reject password with other special characters (not in allowed set)', () => {
        const invalid = {
          email: 'test@example.com',
          password: 'Password123#',
        };

        expect(() => registerSchema.parse(invalid)).toThrow('special character');
      });

      it('should accept password with multiple special characters', () => {
        const valid = {
          email: 'test@example.com',
          password: 'Password123!@$',
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });
    });

    describe('edge cases', () => {
      it('should handle password with all requirements at minimum', () => {
        const valid = {
          email: 'test@example.com',
          password: 'Pass123!', // 8 chars: P, a, 1, !
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });

      it('should handle password with unicode characters', () => {
        const valid = {
          email: 'test@example.com',
          password: 'Pass123!ñ',
        };

        expect(() => registerSchema.parse(valid)).not.toThrow();
      });

      it('should handle password with spaces (after trim)', () => {
        const data = {
          email: 'test@example.com',
          password: '  SecurePass123!  ',
        };

        const result = registerSchema.parse(data);
        expect(result.password).toBe('SecurePass123!');
      });
    });
  });

  describe('loginSchema', () => {
    it('should accept valid credentials', () => {
      const valid = {
        email: 'test@example.com',
        password: 'anypassword',
      };

      expect(() => loginSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalid = {
        email: 'invalid-email',
        password: 'password',
      };

      expect(() => loginSchema.parse(invalid)).toThrow('Invalid email format');
    });

    it('should reject empty password', () => {
      const invalid = {
        email: 'test@example.com',
        password: '',
      };

      expect(() => loginSchema.parse(invalid)).toThrow('Password is required');
    });
  });

  describe('verifyTotpSchema', () => {
    it('should accept valid TOTP data', () => {
      const valid = {
        sessionToken: 'valid-session-token-123',
        totpCode: '123456',
      };

      expect(() => verifyTotpSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid session token format', () => {
      const invalid = {
        sessionToken: 'invalid token with spaces!',
        totpCode: '123456',
      };

      expect(() => verifyTotpSchema.parse(invalid)).toThrow('Invalid token format');
    });

    it('should reject TOTP code that is not 6 digits', () => {
      const invalid = {
        sessionToken: 'valid-token',
        totpCode: '12345',
      };

      expect(() => verifyTotpSchema.parse(invalid)).toThrow('6 digits');
    });

    it('should reject TOTP code with non-digits', () => {
      const invalid = {
        sessionToken: 'valid-token',
        totpCode: '12345a',
      };

      expect(() => verifyTotpSchema.parse(invalid)).toThrow('only digits');
    });

    it('should reject TOTP code "000000"', () => {
      const invalid = {
        sessionToken: 'valid-token',
        totpCode: '000000',
      };

      expect(() => verifyTotpSchema.parse(invalid)).toThrow('Invalid TOTP code');
    });

    it('should accept valid 6-digit TOTP codes', () => {
      const validCodes = ['123456', '000001', '999999', '456789'];

      validCodes.forEach((code) => {
        if (code === '000000') return; // Skip the invalid one

        const valid = {
          sessionToken: 'valid-token',
          totpCode: code,
        };

        expect(() => verifyTotpSchema.parse(valid)).not.toThrow();
      });
    });

    it('should reject empty session token', () => {
      const invalid = {
        sessionToken: '',
        totpCode: '123456',
      };

      expect(() => verifyTotpSchema.parse(invalid)).toThrow('Token is required');
    });

    it('should reject session token longer than 500 characters', () => {
      const longToken = 'a'.repeat(501);
      const invalid = {
        sessionToken: longToken,
        totpCode: '123456',
      };

      expect(() => verifyTotpSchema.parse(invalid)).toThrow('too long');
    });
  });

  describe('refreshTokenSchema', () => {
    it('should accept valid refresh token', () => {
      const valid = {
        refreshToken: 'valid-refresh-token-123',
      };

      expect(() => refreshTokenSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid token format', () => {
      const invalid = {
        refreshToken: 'invalid token with spaces!',
      };

      expect(() => refreshTokenSchema.parse(invalid)).toThrow('Invalid token format');
    });

    it('should reject empty token', () => {
      const invalid = {
        refreshToken: '',
      };

      expect(() => refreshTokenSchema.parse(invalid)).toThrow('Token is required');
    });

    it('should reject token longer than 500 characters', () => {
      const longToken = 'a'.repeat(501);
      const invalid = {
        refreshToken: longToken,
      };

      expect(() => refreshTokenSchema.parse(invalid)).toThrow('too long');
    });
  });

  describe('logoutSchema', () => {
    it('should accept valid refresh token', () => {
      const valid = {
        refreshToken: 'valid-refresh-token-123',
      };

      expect(() => logoutSchema.parse(valid)).not.toThrow();
    });

    it('should have same validation as refreshTokenSchema', () => {
      const invalid = {
        refreshToken: 'invalid token with spaces!',
      };

      expect(() => logoutSchema.parse(invalid)).toThrow('Invalid token format');
    });
  });
});

