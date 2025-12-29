import { File } from '@domain/entities/File';
import { FileId } from '@domain/value-objects/FileId';
import { FileName } from '@domain/value-objects/FileName';
import { UserId } from '@domain/value-objects/UserId';
import { AccessTypeVO } from '@domain/value-objects/AccessType';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { IStorageService } from '@application/interfaces/IStorageService';
import { v4 as uuidv4 } from 'uuid';

export interface RequestUploadUrlInput {
    userId: string;
    fileName: string;
    fileSize: number;
    mimeType?: string;
    parentFolderId?: string | null;
    accessType?: 'private' | 'public' | 'link_shared' | 'shared';
}

export interface RequestUploadUrlOutput {
    fileId: string;
    uploadUrl: string;
    objectKey: string;
    expiresIn: number;
    fileName: string;
}

export class RequestUploadUrlUseCase {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly storageService: IStorageService
    ) {}

    async execute(input: RequestUploadUrlInput): Promise<RequestUploadUrlOutput> {
        // Validate file size (5GB max)
        if (input.fileSize > 5 * 1024 * 1024 * 1024) {
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

        // Generate object key (UUID-based for security)
        const objectKey = uuidv4();

        // Generate presigned upload URL (1 hour expiry)
        const uploadUrl = await this.storageService.generatePresignedUploadUrl(objectKey, 3600);

        // Create file entity with size 0 (will be updated after upload confirmation)
        const file = File.createFile(
            fileId,
            userId,
            fileName,
            0, // Size will be updated after upload
            input.mimeType || null,
            objectKey,
            parentFolderId,
            'standard',
            accessType
        );

        // Save to database (with size 0, will be updated after upload)
        await this.fileRepository.save(file);

        return {
            fileId: file.getId().toString(),
            uploadUrl,
            objectKey,
            expiresIn: 3600,
            fileName: file.getName().toString(),
        };
    }
}

