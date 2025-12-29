import { Router } from 'express';
import { FileController } from '@presentation/http/controllers/FileController';
import { rateLimiters } from '@presentation/middleware/RateLimitMiddleware';
import { asyncHandler } from '@presentation/middleware/ErrorHandlerMiddleware';
import { authMiddleware } from '@presentation/middleware/AuthMiddleware';
import { optionalAuthMiddleware } from '@presentation/middleware/OptionalAuthMiddleware';
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024, // 5GB
    },
});

export function createFileRoutes(fileController: FileController): Router {
    const router = Router();

    // Request presigned upload URL (for large files > 10MB)
    router.post(
        '/upload/request',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.requestUploadUrl(req, res))
    );

    // Confirm upload completion (after direct upload to OCI)
    router.post(
        '/upload/confirm/:fileId',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.confirmUpload(req, res))
    );

    // Upload file (for small files < 10MB)
    router.post(
        '/upload',
        authMiddleware,
        rateLimiters.general,
        upload.single('file'),
        asyncHandler((req, res) => fileController.upload(req, res))
    );

    // List files (optionally in a folder)
    router.get(
        '/list',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.list(req, res))
    );

    // Download file (supports share token for public access)
    router.get(
        '/download/:fileId',
        optionalAuthMiddleware, // Optionally extract user from token if present
        rateLimiters.general,
        asyncHandler((req, res) => fileController.download(req, res))
    );

    // Create folder
    router.post(
        '/folder',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.createFolder(req, res))
    );

    // Move file/folder
    router.post(
        '/move/:fileId',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.move(req, res))
    );

    // Set file access (private, public, link_shared, shared)
    router.put(
        '/access/:fileId',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.setAccess(req, res))
    );

    // Share file with specific user
    router.post(
        '/share/:fileId',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.share(req, res))
    );

    // Update permission for a user (change permission type)
    router.put(
        '/permissions/:fileId',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.updatePermission(req, res))
    );

    // Get all permissions for a file (list who has access)
    router.get(
        '/permissions/:fileId',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.getPermissions(req, res))
    );

    // Revoke permission (remove user's access)
    router.delete(
        '/permissions/:fileId',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.revokePermission(req, res))
    );

    // Move file to archive tier (cost optimization)
    router.post(
        '/archive/:fileId',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.moveToArchive(req, res))
    );

    // Restore file from archive tier
    router.post(
        '/restore/:fileId',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.restoreFromArchive(req, res))
    );

    // Get storage statistics (cost breakdown)
    router.get(
        '/stats',
        authMiddleware,
        rateLimiters.general,
        asyncHandler((req, res) => fileController.getStorageStats(req, res))
    );

    return router;
}
