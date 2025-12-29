import { z } from 'zod';

export const registerUserSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z
            .string()
            .min(12, 'Password must be at least 12 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
        password: z.string().min(1, 'Password is required'),
    }),
});

export const verifyTotpSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
        totpCode: z.string().length(6, 'TOTP code must be 6 digits').regex(/^\d+$/, 'TOTP code must be numeric'),
        deviceId: z.string().uuid('Invalid device ID format').optional(),
    }),
});

export const refreshTokenSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
});

export const logoutSchema = z.object({
    body: z.object({
        refreshToken: z.string().min(1, 'Refresh token is required'),
    }),
});

export const requestPasswordResetSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Reset token is required'),
        newPassword: z
            .string()
            .min(12, 'Password must be at least 12 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    }),
});

export const verifyEmailSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Verification token is required'),
    }),
});

export const resendEmailVerificationSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format').optional(),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z
            .string()
            .min(12, 'Password must be at least 12 characters')
            .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
            .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
            .regex(/[0-9]/, 'Password must contain at least one number')
            .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    }),
});

export const verifyDeviceSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Verification token is required'),
    }),
});

export const setupPrimaryDeviceSchema = z.object({
    body: z.object({
        deviceId: z.string().uuid('Invalid device ID format'),
    }),
});

export const setupRecoveryEmailSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email format'),
    }),
});

export const verifyRecoveryEmailSchema = z.object({
    body: z.object({
        token: z.string().min(1, 'Verification token is required'),
    }),
});

export const revokeDeviceSchema = z.object({
    params: z.object({
        deviceId: z.string().uuid('Invalid device ID format'),
    }),
});

export const regenerateTotpSchema = z.object({
    body: z.object({
        password: z.string().min(1, 'Password is required'),
    }),
});


