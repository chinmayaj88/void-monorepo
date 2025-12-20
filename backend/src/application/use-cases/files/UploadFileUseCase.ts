import { File } from '@domain/entities/File';
import { FileId } from '@domain/value-objects/FileId';
import { FileName } from '@domain/value-objects/FileName';
import { UserId } from '@domain/value-objects/UserId';
import { AccessTypeVO } from '@domain/value-objects/AccessType';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { IStorageService } from '@application/interfaces/IStorageService';
import { v4 as uuidv4 } from 'uuid';

export interface UploadFileInput {
    userId: string;
    fileName: string;
    fileBuffer: Buffer;
    mimeType?: string;
    parentFolderId?: string | null;
    accessType?: 'private' | 'public' | 'link_shared' | 'shared';
}

export interface UploadFileOutput {
    fileId: string;
    fileName: string;
    size: number;
    mimeType: string | null;
    parentFolderId: string | null;
    accessType: string;
    createdAt: Date;
}

export class UploadFileUseCase {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly storageService: IStorageService
    ) {}

    async execute(input: UploadFileInput): Promise<UploadFileOutput> {
        // Validate file size (5GB max)
        if (input.fileBuffer.length > 5 * 1024 * 1024 * 1024) {
            throw new Error('File size cannot exceed 5GB');
        }

        // Validate file name
        const fileName = FileName.create(input.fileName);
        const userId = UserId.fromString(input.userId);
        const fileId = FileId.create(uuidv4());
        const parentFolderId = input.parentFolderId ? FileId.fromString(input.parentFolderId) : null;
        const accessType = AccessTypeVO.create(input.accessType || 'private');

        // Validate parent folder exists and belongs to user
        if (parentFolderId) {
            const parentFolder = await this.fileRepository.findFolderById(parentFolderId);
            if (!parentFolder) {
                throw new Error('Parent folder not found');
            }
            if (!parentFolder.isOwnedBy(userId)) {
                throw new Error('You do not have permission to upload to this folder');
            }
        }

        // Upload to OCI storage
        const uploadResult = await this.storageService.upload(
            input.fileBuffer,
            fileName.toString(),
            input.mimeType
        );

        // Create file entity
        const file = File.createFile(
            fileId,
            userId,
            fileName,
            uploadResult.size,
            input.mimeType || null,
            uploadResult.objectKey,
            parentFolderId,
            'standard',
            accessType
        );

        // Save to database
        await this.fileRepository.save(file);

        return {
            fileId: file.getId().toString(),
            fileName: file.getName().toString(),
            size: file.getSize(),
            mimeType: file.getMimeType(),
            parentFolderId: file.getParentFolderId()?.toString() || null,
            accessType: file.getAccessType().toString(),
            createdAt: file.getCreatedAt(),
        };
    }
}
