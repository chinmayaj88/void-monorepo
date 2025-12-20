import { Request, Response } from 'express';
import { UploadFileUseCase } from '@application/use-cases/files/UploadFileUseCase';
import { DownloadFileUseCase } from '@application/use-cases/files/DownloadFileUseCase';
import { ListFilesUseCase } from '@application/use-cases/files/ListFilesUseCase';
import { CreateFolderUseCase } from '@application/use-cases/files/CreateFolderUseCase';
import { MoveFileUseCase } from '@application/use-cases/files/MoveFileUseCase';
import { SetFileAccessUseCase } from '@application/use-cases/files/SetFileAccessUseCase';
import { ShareFileUseCase } from '@application/use-cases/files/ShareFileUseCase';
import { UpdatePermissionUseCase } from '@application/use-cases/files/UpdatePermissionUseCase';
import { GetFilePermissionsUseCase } from '@application/use-cases/files/GetFilePermissionsUseCase';
import { RevokePermissionUseCase } from '@application/use-cases/files/RevokePermissionUseCase';
import { RequestUploadUrlUseCase } from '@application/use-cases/files/RequestUploadUrlUseCase';
import { ConfirmUploadUseCase } from '@application/use-cases/files/ConfirmUploadUseCase';
import { MoveToArchiveUseCase } from '@application/use-cases/files/MoveToArchiveUseCase';
import { RestoreFromArchiveUseCase } from '@application/use-cases/files/RestoreFromArchiveUseCase';
import { GetStorageStatsUseCase } from '@application/use-cases/files/GetStorageStatsUseCase';

export class FileController {
    constructor(
        private readonly uploadFileUseCase: UploadFileUseCase,
        private readonly downloadFileUseCase: DownloadFileUseCase,
        private readonly listFilesUseCase: ListFilesUseCase,
        private readonly createFolderUseCase: CreateFolderUseCase,
        private readonly moveFileUseCase: MoveFileUseCase,
        private readonly setFileAccessUseCase: SetFileAccessUseCase,
        private readonly shareFileUseCase: ShareFileUseCase,
        private readonly updatePermissionUseCase: UpdatePermissionUseCase,
        private readonly getFilePermissionsUseCase: GetFilePermissionsUseCase,
        private readonly revokePermissionUseCase: RevokePermissionUseCase,
        private readonly requestUploadUrlUseCase: RequestUploadUrlUseCase,
        private readonly confirmUploadUseCase: ConfirmUploadUseCase,
        private readonly moveToArchiveUseCase: MoveToArchiveUseCase,
        private readonly restoreFromArchiveUseCase: RestoreFromArchiveUseCase,
        private readonly getStorageStatsUseCase: GetStorageStatsUseCase
    ) {}

    async upload(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const file = req.file;
        if (!file) {
            res.status(400).json({ error: 'No file provided' });
            return;
        }

        // Check file size - if large, suggest using presigned URL
        const FILE_SIZE_THRESHOLD = 10 * 1024 * 1024; // 10MB
        if (file.buffer.length > FILE_SIZE_THRESHOLD) {
            res.status(400).json({
                error: 'File too large for direct upload',
                message: `File size (${file.buffer.length} bytes) exceeds threshold (${FILE_SIZE_THRESHOLD} bytes). Please use /api/files/upload/request to get a presigned upload URL.`,
                suggestedEndpoint: '/api/files/upload/request',
            });
            return;
        }

        const result = await this.uploadFileUseCase.execute({
            userId,
            fileName: file.originalname,
            fileBuffer: file.buffer,
            mimeType: file.mimetype,
            parentFolderId: req.body.parentFolderId || null,
            accessType: req.body.accessType || 'private',
        });

        res.status(201).json(result);
    }

    async requestUploadUrl(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { fileName, fileSize, mimeType, parentFolderId, accessType } = req.body;

        if (!fileName || !fileSize) {
            res.status(400).json({ error: 'fileName and fileSize are required' });
            return;
        }

        const result = await this.requestUploadUrlUseCase.execute({
            userId,
            fileName,
            fileSize: parseInt(fileSize, 10),
            mimeType,
            parentFolderId: parentFolderId || null,
            accessType: accessType || 'private',
        });

        res.status(200).json(result);
    }

    async confirmUpload(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { fileId } = req.params;
        const { fileSize } = req.body;

        if (!fileSize) {
            res.status(400).json({ error: 'fileSize is required' });
            return;
        }

        const result = await this.confirmUploadUseCase.execute({
            fileId,
            userId,
            fileSize: parseInt(fileSize, 10),
        });

        res.status(200).json(result);
    }

    async download(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId || null;
        const { fileId } = req.params;
        const shareToken = req.query.shareToken as string | undefined;
        const usePresignedUrl = req.query.usePresignedUrl === 'true';

        const result = await this.downloadFileUseCase.execute({
            fileId,
            userId,
            shareToken,
            usePresignedUrl,
        });

        // If presigned URL, return it in JSON response
        if (result.isPresignedUrl && result.downloadUrl) {
            res.status(200).json({
                downloadUrl: result.downloadUrl,
                fileName: result.fileName,
                size: result.size,
                mimeType: result.mimeType,
                expiresIn: 3600, // 1 hour
                message: 'Use downloadUrl to download the file directly from storage'
            });
            return;
        }

        // Direct download - set security headers
        res.setHeader('Content-Type', result.mimeType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
        res.setHeader('Content-Length', result.size.toString());
        
        // Security headers for file downloads
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'");
        res.setHeader('X-Download-Options', 'noopen');
        
        // Prevent caching of sensitive files
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        if (!result.fileBuffer) {
            res.status(500).json({ error: 'File buffer not available' });
            return;
        }

        res.status(200).send(result.fileBuffer);
    }

    async list(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const parentFolderId = req.query.parentFolderId as string | undefined;

        const result = await this.listFilesUseCase.execute({
            userId,
            parentFolderId: parentFolderId || null,
        });

        res.status(200).json(result);
    }

    async createFolder(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { folderName, parentFolderId, accessType } = req.body;

        const result = await this.createFolderUseCase.execute({
            userId,
            folderName,
            parentFolderId: parentFolderId || null,
            accessType: accessType || 'private',
        });

        res.status(201).json(result);
    }

    async move(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { fileId } = req.params;
        const { newParentFolderId } = req.body;

        const result = await this.moveFileUseCase.execute({
            fileId,
            userId,
            newParentFolderId: newParentFolderId || null,
        });

        res.status(200).json(result);
    }

    async setAccess(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { fileId } = req.params;
        const { accessType } = req.body;

        const result = await this.setFileAccessUseCase.execute({
            fileId,
            userId,
            accessType,
        });

        res.status(200).json(result);
    }

    async share(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { fileId } = req.params;
        const { sharedWithEmail, permissionType } = req.body;

        if (!sharedWithEmail) {
            res.status(400).json({ error: 'sharedWithEmail is required' });
            return;
        }

        if (!permissionType) {
            res.status(400).json({ error: 'permissionType is required (read, write, or delete)' });
            return;
        }

        const result = await this.shareFileUseCase.execute({
            fileId,
            ownerId: userId,
            sharedWithEmail,
            permissionType,
        });

        res.status(200).json(result);
    }

    async updatePermission(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { fileId } = req.params;
        const { sharedWithEmail, permissionType } = req.body;

        if (!sharedWithEmail) {
            res.status(400).json({ error: 'sharedWithEmail is required' });
            return;
        }

        if (!permissionType) {
            res.status(400).json({ error: 'permissionType is required (read, write, or delete)' });
            return;
        }

        const result = await this.updatePermissionUseCase.execute({
            fileId,
            ownerId: userId,
            sharedWithEmail,
            permissionType,
        });

        res.status(200).json(result);
    }

    async getPermissions(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { fileId } = req.params;

        const result = await this.getFilePermissionsUseCase.execute({
            fileId,
            userId,
        });

        res.status(200).json(result);
    }

    async revokePermission(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { fileId } = req.params;
        const { sharedWithEmail } = req.body;

        if (!sharedWithEmail) {
            res.status(400).json({ error: 'sharedWithEmail is required' });
            return;
        }

        const result = await this.revokePermissionUseCase.execute({
            fileId,
            ownerId: userId,
            sharedWithEmail,
        });

        res.status(200).json(result);
    }

    async moveToArchive(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { fileId } = req.params;

        const result = await this.moveToArchiveUseCase.execute({
            fileId,
            userId,
        });

        res.status(200).json(result);
    }

    async restoreFromArchive(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { fileId } = req.params;

        const result = await this.restoreFromArchiveUseCase.execute({
            fileId,
            userId,
        });

        res.status(200).json(result);
    }

    async getStorageStats(req: Request, res: Response): Promise<void> {
        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Get stats for the authenticated user
        const result = await this.getStorageStatsUseCase.execute({
            userId,
        });

        res.status(200).json(result);
    }
}
