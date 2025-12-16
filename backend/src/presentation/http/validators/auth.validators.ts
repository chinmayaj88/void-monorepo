import { z } from 'zod';

const emailField = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required')
  .max(255, 'Email is too long');

export const registerSchema = z.object({
  email: emailField,
  password: z
    .string()
    .trim()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
      'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)'
    ),
});

const basicEmailField = z
  .string()
  .email('Invalid email format')
  .min(1, 'Email is required');

export const verifyCredentialsSchema = z.object({
  email: basicEmailField,
  password: z.string().min(1, 'Password is required'),
});

const tokenField = z
  .string()
  .min(1, 'Token is required')
  .max(500, 'Token is too long')
  .regex(/^[A-Za-z0-9\-_\.]+$/, 'Invalid token format');

export const verifyTotpSchema = z.object({
  sessionToken: tokenField,
  totpCode: z
    .string()
    .length(6, 'TOTP code must be 6 digits')
    .regex(/^\d+$/, 'TOTP code must contain only digits')
    .refine((code) => code !== '000000', 'Invalid TOTP code'),
});

export const refreshTokenSchema = z.object({
  refreshToken: tokenField,
});

export const logoutSchema = z.object({
  refreshToken: tokenField,
});
