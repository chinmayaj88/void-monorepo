import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { FileNotFoundError, UnauthorizedError } from '@domain/errors/DomainError';

export interface MoveFileInput {
    fileId: string;
    userId: string;
    newParentFolderId: string | null;
}

export interface MoveFileOutput {
    fileId: string;
    newParentFolderId: string | null;
    updatedAt: Date;
}

export class MoveFileUseCase {
    constructor(private readonly fileRepository: IFileRepository) {}

    async execute(input: MoveFileInput): Promise<MoveFileOutput> {
        const fileId = FileId.fromString(input.fileId);
        const userId = UserId.fromString(input.userId);
        const newParentFolderId = input.newParentFolderId ? FileId.fromString(input.newParentFolderId) : null;

        // Find file
        const file = await this.fileRepository.findById(fileId);
        if (!file) {
            throw new FileNotFoundError(input.fileId);
        }

        // Check ownership
        if (!file.isOwnedBy(userId)) {
            throw new UnauthorizedError('You do not have permission to move this file');
        }

        // Prevent moving folder into itself or its descendants
        if (newParentFolderId && file.getIsFolder()) {
            await this.validateNoCircularReference(fileId, newParentFolderId);
        }

        // Validate new parent folder exists and belongs to user
        if (newParentFolderId) {
            const parentFolder = await this.fileRepository.findFolderById(newParentFolderId);
            if (!parentFolder) {
                throw new Error('Destination folder not found');
            }
            if (!parentFolder.isOwnedBy(userId)) {
                throw new UnauthorizedError('You do not have permission to move to this folder');
            }
        }

        // Check for duplicate name in destination
        const destinationFiles = await this.fileRepository.findByOwnerId(userId, newParentFolderId);
        const duplicate = destinationFiles.find(
            f => f.getName().equals(file.getName()) && f.getId().toString() !== fileId.toString()
        );
        if (duplicate) {
            throw new Error('A file or folder with this name already exists in the destination');
        }

        // Move file
        const updatedFile = file.moveToFolder(newParentFolderId);
        await this.fileRepository.save(updatedFile);

        return {
            fileId: file.getId().toString(),
            newParentFolderId: file.getParentFolderId()?.toString() || null,
            updatedAt: file.getUpdatedAt(),
        };
    }

    private async validateNoCircularReference(folderId: FileId, newParentId: FileId): Promise<void> {
        let currentParentId: FileId | null = newParentId;
        
        while (currentParentId) {
            if (currentParentId.equals(folderId)) {
                throw new Error('Cannot move folder into itself or its descendants');
            }
            const parent = await this.fileRepository.findById(currentParentId);
            currentParentId = parent?.getParentFolderId() || null;
        }
    }
}

