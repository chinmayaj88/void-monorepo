import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { IStorageService } from '@application/interfaces/IStorageService';
import { FileNotFoundError, UnauthorizedError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export interface RestoreFromArchiveInput {
    fileId: string;
    userId: string;
}

export interface RestoreFromArchiveOutput {
    fileId: string;
    fileName: string;
    storageTier: string;
    message: string;
    restoreTime: string;
}

export class RestoreFromArchiveUseCase {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly storageService: IStorageService
    ) {}

    async execute(input: RestoreFromArchiveInput): Promise<RestoreFromArchiveOutput> {
        const fileId = FileId.fromString(input.fileId);
        const userId = UserId.fromString(input.userId);

        // Find file
        const file = await this.fileRepository.findById(fileId);
        if (!file) {
            throw new FileNotFoundError(input.fileId);
        }

        // Check ownership
        if (!file.isOwnedBy(userId)) {
            throw new UnauthorizedError('You do not have permission to restore this file');
        }

        // Don't allow restoring folders
        if (file.getIsFolder()) {
            throw new Error('Cannot restore a folder');
        }

        // Check if already in standard tier
        if (file.getStorageTier() === 'standard') {
            return {
                fileId: file.getId().toString(),
                fileName: file.getName().toString(),
                storageTier: 'standard',
                message: 'File is already in standard tier',
                restoreTime: '0 minutes',
            };
        }

        // Initiate restore from archive in OCI
        await this.storageService.restoreFromArchive(file.getOciObjectKey());

        // Note: We don't update the database tier immediately
        // The file will be restored in OCI (takes 1-5 minutes)
        // After restore completes, the tier will be updated when the file is accessed
        // Or you can manually update it after confirming restore completion

        logger.info('File restore from archive initiated', {
            fileId: input.fileId,
            fileName: file.getName().toString(),
            size: file.getSize(),
            userId: input.userId
        });

        return {
            fileId: file.getId().toString(),
            fileName: file.getName().toString(),
            storageTier: 'archive',
            message: 'Restore initiated. File will be available in standard tier in 1-5 minutes. You can download it after restoration completes.',
            restoreTime: '1-5 minutes',
        };
    }
}

