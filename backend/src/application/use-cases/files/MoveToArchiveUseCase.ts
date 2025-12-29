import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { IStorageService } from '@application/interfaces/IStorageService';
import { FileNotFoundError, UnauthorizedError } from '@domain/errors/DomainError';
import { logger } from '@infrastructure/config/Logger';

export interface MoveToArchiveInput {
    fileId: string;
    userId: string;
}

export interface MoveToArchiveOutput {
    fileId: string;
    fileName: string;
    storageTier: string;
    message: string;
}

export class MoveToArchiveUseCase {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly storageService: IStorageService
    ) {}

    async execute(input: MoveToArchiveInput): Promise<MoveToArchiveOutput> {
        const fileId = FileId.fromString(input.fileId);
        const userId = UserId.fromString(input.userId);

        // Find file
        const file = await this.fileRepository.findById(fileId);
        if (!file) {
            throw new FileNotFoundError(input.fileId);
        }

        // Check ownership
        if (!file.isOwnedBy(userId)) {
            throw new UnauthorizedError('You do not have permission to archive this file');
        }

        // Don't allow archiving folders
        if (file.getIsFolder()) {
            throw new Error('Cannot archive a folder');
        }

        // Check if already archived
        if (file.getStorageTier() === 'archive') {
            return {
                fileId: file.getId().toString(),
                fileName: file.getName().toString(),
                storageTier: 'archive',
                message: 'File is already archived',
            };
        }

        // Move to archive in OCI (via lifecycle policy or API)
        // Note: Actual OCI tier transition happens via lifecycle policy
        // This updates the database to reflect the archive status
        await this.storageService.moveToArchive(file.getOciObjectKey());

        // Update storage tier in database
        await this.fileRepository.updateStorageTier(fileId, 'archive');

        logger.info('File moved to archive', {
            fileId: input.fileId,
            fileName: file.getName().toString(),
            size: file.getSize(),
            userId: input.userId
        });

        return {
            fileId: file.getId().toString(),
            fileName: file.getName().toString(),
            storageTier: 'archive',
            message: 'File moved to archive tier successfully. Access will be slower but storage costs are reduced by ~90%.',
        };
    }
}

