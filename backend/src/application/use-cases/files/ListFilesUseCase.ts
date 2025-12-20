import { UserId } from '@domain/value-objects/UserId';
import { FileId } from '@domain/value-objects/FileId';
import { IFileRepository } from '@application/interfaces/IFileRepository';

export interface ListFilesInput {
    userId: string;
    parentFolderId?: string | null;
}

export interface ListFilesOutput {
    files: Array<{
        fileId: string;
        fileName: string;
        size: number;
        mimeType: string | null;
        isFolder: boolean;
        parentFolderId: string | null;
        accessType: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}

export class ListFilesUseCase {
    constructor(private readonly fileRepository: IFileRepository) {}

    async execute(input: ListFilesInput): Promise<ListFilesOutput> {
        const userId = UserId.fromString(input.userId);
        const parentFolderId = input.parentFolderId ? FileId.fromString(input.parentFolderId) : null;

        const files = await this.fileRepository.findByOwnerId(userId, parentFolderId);

        return {
            files: files.map(file => ({
                fileId: file.getId().toString(),
                fileName: file.getName().toString(),
                size: file.getSize(),
                mimeType: file.getMimeType(),
                isFolder: file.getIsFolder(),
                parentFolderId: file.getParentFolderId()?.toString() || null,
                accessType: file.getAccessType().toString(),
                createdAt: file.getCreatedAt(),
                updatedAt: file.getUpdatedAt(),
            })),
        };
    }
}
