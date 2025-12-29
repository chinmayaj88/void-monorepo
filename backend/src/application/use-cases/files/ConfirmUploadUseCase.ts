import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { FileNotFoundError, UnauthorizedError } from '@domain/errors/DomainError';
import { File } from '@domain/entities/File';

export interface ConfirmUploadInput {
    fileId: string;
    userId: string;
    fileSize: number;
}

export interface ConfirmUploadOutput {
    fileId: string;
    fileName: string;
    size: number;
    message: string;
}

export class ConfirmUploadUseCase {
    constructor(private readonly fileRepository: IFileRepository) {}

    async execute(input: ConfirmUploadInput): Promise<ConfirmUploadOutput> {
        const fileId = FileId.fromString(input.fileId);
        const userId = UserId.fromString(input.userId);

        // Find file
        const file = await this.fileRepository.findById(fileId);
        if (!file) {
            throw new FileNotFoundError(input.fileId);
        }

        // Check ownership
        if (!file.isOwnedBy(userId)) {
            throw new UnauthorizedError('You do not have permission to confirm this upload');
        }

        // Validate file size
        if (input.fileSize <= 0) {
            throw new Error('File size must be greater than 0');
        }

        if (input.fileSize > 5 * 1024 * 1024 * 1024) {
            throw new Error('File size cannot exceed 5GB');
        }

        // Update file size by creating new instance with updated size
        // Since File entity is immutable, we need to use reconstitute
        const updatedFile = File.reconstitute(
            file.getId(),
            file.getOwnerId(),
            file.getName(),
            input.fileSize, // Update size
            file.getMimeType(),
            file.getOciObjectKey(),
            file.getStorageTier(),
            file.getIsFolder(),
            file.getParentFolderId(),
            file.getAccessType(),
            file.getShareToken(),
            file.getCreatedAt(),
            new Date() // Update timestamp
        );

        // Save updated file
        await this.fileRepository.save(updatedFile);

        return {
            fileId: updatedFile.getId().toString(),
            fileName: updatedFile.getName().toString(),
            size: updatedFile.getSize(),
            message: 'Upload confirmed successfully',
        };
    }
}

