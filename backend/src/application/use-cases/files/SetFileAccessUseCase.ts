import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { AccessTypeVO } from '@domain/value-objects/AccessType';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { FileNotFoundError, UnauthorizedError } from '@domain/errors/DomainError';
import { v4 as uuidv4 } from 'uuid';

export interface SetFileAccessInput {
    fileId: string;
    userId: string;
    accessType: 'private' | 'public' | 'link_shared' | 'shared';
}

export interface SetFileAccessOutput {
    fileId: string;
    accessType: string;
    shareToken: string | null;
    updatedAt: Date;
}

export class SetFileAccessUseCase {
    constructor(private readonly fileRepository: IFileRepository) {}

    async execute(input: SetFileAccessInput): Promise<SetFileAccessOutput> {
        const fileId = FileId.fromString(input.fileId);
        const userId = UserId.fromString(input.userId);
        const accessType = AccessTypeVO.create(input.accessType);

        // Find file
        const file = await this.fileRepository.findById(fileId);
        if (!file) {
            throw new FileNotFoundError(input.fileId);
        }

        // Check ownership
        if (!file.isOwnedBy(userId)) {
            throw new UnauthorizedError('You do not have permission to change access for this file');
        }

        // Generate share token if link_shared
        let shareToken: string | null = null;
        if (accessType.isLinkShared()) {
            shareToken = uuidv4();
        } else if (file.getShareToken()) {
            // Clear share token if changing from link_shared to something else
            shareToken = null;
        } else {
            shareToken = file.getShareToken();
        }

        // Update access type and share token
        let updatedFile = file.updateAccessType(accessType);
        updatedFile = updatedFile.setShareToken(shareToken);
        await this.fileRepository.save(updatedFile);

        return {
            fileId: updatedFile.getId().toString(),
            accessType: updatedFile.getAccessType().toString(),
            shareToken: updatedFile.getShareToken(),
            updatedAt: updatedFile.getUpdatedAt(),
        };
    }
}

