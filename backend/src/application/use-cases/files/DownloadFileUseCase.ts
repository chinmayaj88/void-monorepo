import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { File } from '@domain/entities/File';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { IPermissionRepository } from '@application/interfaces/IPermissionRepository';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { IStorageService } from '@application/interfaces/IStorageService';
import { FileNotFoundError, UnauthorizedError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export interface DownloadFileInput {
    fileId: string;
    userId: string | null; // null for public/link access
    shareToken?: string;
    usePresignedUrl?: boolean; // Force presigned URL instead of direct download
}

export interface DownloadFileOutput {
    fileBuffer?: Buffer; // Only for direct download
    fileName: string;
    mimeType: string | null;
    size: number;
    downloadUrl?: string; // Presigned URL for large files
    isPresignedUrl: boolean; // Indicates if presigned URL was used
    isArchived?: boolean; // Indicates if file is in archive tier
    restoreInProgress?: boolean; // Indicates if restore is in progress
    message?: string; // Additional message (e.g., restore status)
}

export class DownloadFileUseCase {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly permissionRepository: IPermissionRepository,
        private readonly storageService: IStorageService,
        private readonly userRepository: IUserRepository
    ) {}

    async execute(input: DownloadFileInput): Promise<DownloadFileOutput> {
        const fileId = FileId.fromString(input.fileId);
        const userId = input.userId ? UserId.fromString(input.userId) : null;

        // Find file
        let file = await this.fileRepository.findById(fileId);
        
        // If share token provided, find by share token
        if (input.shareToken && !file) {
            file = await this.fileRepository.findByShareToken(input.shareToken);
            if (!file || !file.getId().equals(fileId)) {
                throw new FileNotFoundError(input.fileId);
            }
        }

        if (!file) {
            throw new FileNotFoundError(input.fileId);
        }

        // Check access permissions
        if (!await this.hasAccess(file, userId)) {
            logger.warn('Download access denied', { 
                fileId: input.fileId, 
                userId: userId?.toString() || 'anonymous',
                accessType: file.getAccessType().toString()
            });
            throw new UnauthorizedError('You do not have permission to access this file');
        }

        // Don't allow downloading folders
        if (file.getIsFolder()) {
            throw new Error('Cannot download a folder');
        }

        // Get OCI object key (files always have one)
        const ociObjectKey = file.getOciObjectKey();
        if (!ociObjectKey || ociObjectKey.trim().length === 0) {
            throw new Error('File does not have an associated storage object');
        }

        // Record access (for archiving decisions)
        await this.fileRepository.recordAccess(fileId);

        // Check if file is in archive tier
        const storageTier = file.getStorageTier();
        const isArchived = storageTier === 'archive';

        // Log download attempt
        logger.info('File download requested', {
            fileId: input.fileId,
            fileName: file.getName().toString(),
            size: file.getSize(),
            userId: userId?.toString() || 'anonymous',
            accessType: file.getAccessType().toString(),
            storageTier
        });

        // If file is archived, initiate restore and return restore status
        if (isArchived) {
            try {
                await this.storageService.restoreFromArchive(ociObjectKey);
                logger.info('Archive restore initiated', { fileId: input.fileId });
                
                return {
                    fileName: file.getName().toString(),
                    mimeType: file.getMimeType(),
                    size: file.getSize(),
                    downloadUrl: undefined,
                    isPresignedUrl: false,
                    // Add archive-specific fields
                    isArchived: true,
                    restoreInProgress: true,
                    message: 'File is archived. Restore initiated. Please try again in 1-5 minutes.'
                } as DownloadFileOutput & { isArchived: boolean; restoreInProgress: boolean; message: string };
            } catch (error) {
                logger.error('Failed to restore from archive', { fileId: input.fileId, error });
                throw new Error('File is archived. Failed to initiate restore. Please try again later.');
            }
        }

        // Determine if we should use presigned URL
        // Use presigned URL for files > 10MB or if explicitly requested
        const PRESIGNED_URL_THRESHOLD = 10 * 1024 * 1024; // 10MB
        const fileSize = file.getSize();
        const shouldUsePresignedUrl = input.usePresignedUrl || fileSize > PRESIGNED_URL_THRESHOLD;

        if (shouldUsePresignedUrl) {
            // Generate presigned URL for large files (more efficient)
            const presignedUrl = await this.storageService.generatePresignedUrl(ociObjectKey, 3600); // 1 hour expiry
            
            logger.info('Presigned URL generated for download', {
                fileId: input.fileId,
                fileName: file.getName().toString(),
                size: fileSize
            });

            return {
                fileName: file.getName().toString(),
                mimeType: file.getMimeType(),
                size: fileSize,
                downloadUrl: presignedUrl,
                isPresignedUrl: true,
            };
        }

        // Direct download for smaller files
        const fileBuffer = await this.storageService.download(ociObjectKey);

        logger.info('File downloaded successfully', {
            fileId: input.fileId,
            fileName: file.getName().toString(),
            size: fileSize
        });

        return {
            fileBuffer,
            fileName: file.getName().toString(),
            mimeType: file.getMimeType(),
            size: fileSize,
            isPresignedUrl: false,
        };
    }

    private async hasAccess(file: File, userId: UserId | null): Promise<boolean> {
        const accessType = file.getAccessType();

        // Public access - anyone can access
        if (accessType.isPublic()) {
            return true;
        }

        // Link shared - anyone with the link (userId can be null)
        if (accessType.isLinkShared() && file.getShareToken()) {
            return true; // Share token already validated in findByShareToken
        }

        // Private or shared - need authenticated user
        if (!userId) {
            return false;
        }

        // Owner always has access
        if (file.isOwnedBy(userId)) {
            return true;
        }

        // Check if user has explicit permission (using email)
        if (accessType.isShared()) {
            // Get user's email to check permissions (permissions stored by email)
            const user = await this.userRepository.findById(userId);
            if (!user) {
                return false;
            }
            const userEmail = user.getEmail(); // Already an Email value object
            return await this.permissionRepository.hasPermission(file.getId(), userEmail, 'read');
        }

        // Private - only owner
        return false;
    }
}
