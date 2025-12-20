import { File } from '@domain/entities/File';
import { FileId } from '@domain/value-objects/FileId';
import { FileName } from '@domain/value-objects/FileName';
import { UserId } from '@domain/value-objects/UserId';
import { AccessTypeVO } from '@domain/value-objects/AccessType';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { v4 as uuidv4 } from 'uuid';

export interface CreateFolderInput {
    userId: string;
    folderName: string;
    parentFolderId?: string | null;
    accessType?: 'private' | 'public' | 'link_shared' | 'shared';
}

export interface CreateFolderOutput {
    folderId: string;
    folderName: string;
    parentFolderId: string | null;
    accessType: string;
    createdAt: Date;
}

export class CreateFolderUseCase {
    constructor(private readonly fileRepository: IFileRepository) {}

    async execute(input: CreateFolderInput): Promise<CreateFolderOutput> {
        const folderName = FileName.create(input.folderName);
        const userId = UserId.fromString(input.userId);
        const folderId = FileId.create(uuidv4());
        const parentFolderId = input.parentFolderId ? FileId.fromString(input.parentFolderId) : null;
        const accessType = AccessTypeVO.create(input.accessType || 'private');

        // Validate parent folder exists and belongs to user
        if (parentFolderId) {
            const parentFolder = await this.fileRepository.findFolderById(parentFolderId);
            if (!parentFolder) {
                throw new Error('Parent folder not found');
            }
            if (!parentFolder.isOwnedBy(userId)) {
                throw new Error('You do not have permission to create folder here');
            }
        }

        // Check if folder with same name already exists in parent
        const existingFiles = await this.fileRepository.findByOwnerId(userId, parentFolderId);
        const duplicate = existingFiles.find(
            f => f.getName().toString() === folderName.toString() && f.getIsFolder()
        );
        if (duplicate) {
            throw new Error('Folder with this name already exists');
        }

        // Create folder entity
        const folder = File.createFolder(folderId, userId, folderName, parentFolderId, accessType);

        // Save to database
        await this.fileRepository.save(folder);

        return {
            folderId: folder.getId().toString(),
            folderName: folder.getName().toString(),
            parentFolderId: folder.getParentFolderId()?.toString() || null,
            accessType: folder.getAccessType().toString(),
            createdAt: folder.getCreatedAt(),
        };
    }
}

