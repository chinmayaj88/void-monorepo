import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { IPermissionRepository } from '@application/interfaces/IPermissionRepository';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { FileNotFoundError, UnauthorizedError, UserNotFoundError } from '@domain/errors/DomainError';

export interface RevokePermissionInput {
    fileId: string;
    ownerId: string;
    sharedWithEmail: string;
}

export interface RevokePermissionOutput {
    fileId: string;
    sharedWithEmail: string;
    message: string;
}

export class RevokePermissionUseCase {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly permissionRepository: IPermissionRepository,
        private readonly userRepository: IUserRepository
    ) {}

    async execute(input: RevokePermissionInput): Promise<RevokePermissionOutput> {
        const fileId = FileId.fromString(input.fileId);
        const ownerId = UserId.fromString(input.ownerId);

        // Validate and find user by email
        let email: Email;
        try {
            email = Email.create(input.sharedWithEmail);
        } catch {
            throw new Error('Invalid email format');
        }

        // Verify user exists
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
            throw new UnauthorizedError('You do not have permission to revoke permissions for this file');
        }

        // Check if permission exists
        const hasPermission = await this.permissionRepository.hasPermission(fileId, email, 'read');
        if (!hasPermission) {
            throw new Error('User does not have access to this file');
        }

        // Revoke permission
        await this.permissionRepository.revokePermission(fileId, email);

        return {
            fileId: file.getId().toString(),
            sharedWithEmail: email.toString(),
            message: 'Permission revoked successfully',
        };
    }
}

