import { IFileRepository } from '@application/interfaces/IFileRepository';
import { IStorageService } from '@application/interfaces/IStorageService';
import { logger } from '@infrastructure/config/Logger';

export interface AutoArchiveInput {
    daysSinceAccess?: number; // Default: 90 days
    limit?: number; // Default: 100 files per run
}

export interface AutoArchiveOutput {
    filesArchived: number;
    totalSizeArchived: number;
    message: string;
}

export class AutoArchiveUseCase {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly storageService: IStorageService
    ) {}

    async execute(input: AutoArchiveInput = {}): Promise<AutoArchiveOutput> {
        const daysSinceAccess = input.daysSinceAccess || 90;
        const limit = input.limit || 100;

        logger.info('Auto-archive job started', { daysSinceAccess, limit });

        // Find files eligible for archiving
        const filesToArchive = await this.fileRepository.findFilesForAutoArchive(daysSinceAccess, limit);

        if (filesToArchive.length === 0) {
            logger.info('No files found for auto-archiving');
            return {
                filesArchived: 0,
                totalSizeArchived: 0,
                message: 'No files found for archiving',
            };
        }

        let filesArchived = 0;
        let totalSizeArchived = 0;
        const errors: string[] = [];

        // Archive each file
        for (const file of filesToArchive) {
            try {
                // Skip folders
                if (file.getIsFolder()) {
                    continue;
                }

                // Move to archive in OCI
                await this.storageService.moveToArchive(file.getOciObjectKey());

                // Update storage tier in database
                await this.fileRepository.updateStorageTier(file.getId(), 'archive');

                filesArchived++;
                totalSizeArchived += file.getSize();

                logger.info('File auto-archived', {
                    fileId: file.getId().toString(),
                    fileName: file.getName().toString(),
                    size: file.getSize(),
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                errors.push(`${file.getName().toString()}: ${errorMessage}`);
                logger.error('Failed to auto-archive file', {
                    fileId: file.getId().toString(),
                    error: errorMessage,
                });
            }
        }

        const message = errors.length > 0
            ? `Archived ${filesArchived} files (${(totalSizeArchived / 1024 / 1024 / 1024).toFixed(2)} GB). ${errors.length} errors occurred.`
            : `Successfully archived ${filesArchived} files (${(totalSizeArchived / 1024 / 1024 / 1024).toFixed(2)} GB).`;

        logger.info('Auto-archive job completed', {
            filesArchived,
            totalSizeArchived,
            errors: errors.length,
        });

        return {
            filesArchived,
            totalSizeArchived,
            message,
        };
    }
}

