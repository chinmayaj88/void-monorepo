import { z } from 'zod';

export const uploadFileSchema = z.object({
    fileName: z
        .string()
        .min(1, 'File name is required')
        .max(255, 'File name cannot exceed 255 characters')
        .refine(
            (name) => !name.includes('..') && !name.includes('/') && !name.includes('\\'),
            'File name contains invalid characters'
        ),
});

export const downloadFileSchema = z.object({
    fileId: z.string().uuid('Invalid file ID format'),
});