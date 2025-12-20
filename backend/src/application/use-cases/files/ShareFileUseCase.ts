import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { AccessTypeVO } from '@domain/value-objects/AccessType';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { IPermissionRepository, PermissionType } from '@application/interfaces/IPermissionRepository';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { FileNotFoundError, UnauthorizedError, UserNotFoundError } from '@domain/errors/DomainError';

export interface ShareFileInput {
    fileId: string;
    ownerId: string;
    sharedWithEmail: string;
    permissionType: 'read' | 'write' | 'delete';
}

export interface ShareFileOutput {
    fileId: string;
    sharedWithEmail: string;
    permissionType: string;
}

export class ShareFileUseCase {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly permissionRepository: IPermissionRepository,
        private readonly userRepository: IUserRepository
    ) {}

    async execute(input: ShareFileInput): Promise<ShareFileOutput> {
        const fileId = FileId.fromString(input.fileId);
        const ownerId = UserId.fromString(input.ownerId);
        const permissionType = input.permissionType as PermissionType;

        // Validate and find user by email
        let email: Email;
        try {
            email = Email.create(input.sharedWithEmail);
        } catch {
            throw new Error('Invalid email format');
        }

        // Find user by email to verify they exist
        const sharedWithUser = await this.userRepository.findByEmail(email);
        if (!sharedWithUser) {
            throw new UserNotFoundError(`User with email ${input.sharedWithEmail} not found`);
        }

        // Find file
        const file = await this.fileRepository.findById(fileId);
        if (!file) {
            throw new FileNotFoundError(input.fileId);
        }

        // Check ownership
        if (!file.isOwnedBy(ownerId)) {
            throw new UnauthorizedError('You do not have permission to share this file');
        }

        // Can't share with yourself
        const sharedWithUserId = sharedWithUser.getId();
        if (sharedWithUserId.equals(ownerId)) {
            throw new Error('Cannot share file with yourself');
        }

        // Set access type to shared if not already
        if (!file.getAccessType().isShared()) {
            const updatedFile = file.updateAccessType(AccessTypeVO.create('shared'));
            await this.fileRepository.save(updatedFile);
        }

        // Grant permission: store both email (user-friendly) and userId (data integrity)
        await this.permissionRepository.grantPermission(fileId, email, sharedWithUserId, permissionType);

        return {
            fileId: file.getId().toString(),
            sharedWithEmail: email.toString(),
            permissionType,
        };
    }
}

