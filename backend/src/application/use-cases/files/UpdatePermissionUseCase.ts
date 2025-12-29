import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { IPermissionRepository, PermissionType } from '@application/interfaces/IPermissionRepository';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { FileNotFoundError, UnauthorizedError, UserNotFoundError } from '@domain/errors/DomainError';

export interface UpdatePermissionInput {
    fileId: string;
    ownerId: string;
    sharedWithEmail: string;
    permissionType: 'read' | 'write' | 'delete';
}

export interface UpdatePermissionOutput {
    fileId: string;
    sharedWithEmail: string;
    permissionType: string;
}

export class UpdatePermissionUseCase {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly permissionRepository: IPermissionRepository,
        private readonly userRepository: IUserRepository
    ) {}

    async execute(input: UpdatePermissionInput): Promise<UpdatePermissionOutput> {
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

        const sharedWithUserId = sharedWithUser.getId();

        // Find file
        const file = await this.fileRepository.findById(fileId);
        if (!file) {
            throw new FileNotFoundError(input.fileId);
        }

        // Check ownership
        if (!file.isOwnedBy(ownerId)) {
            throw new UnauthorizedError('You do not have permission to update permissions for this file');
        }

        // Check if user has permission (must already be shared)
        const hasPermission = await this.permissionRepository.hasPermission(fileId, email, 'read');
        if (!hasPermission) {
            throw new Error('User does not have access to this file. Share the file first.');
        }

        // Update permission (grantPermission with ON CONFLICT will update existing)
        await this.permissionRepository.grantPermission(fileId, email, sharedWithUserId, permissionType);

        return {
            fileId: file.getId().toString(),
            sharedWithEmail: email.toString(),
            permissionType,
        };
    }
}

