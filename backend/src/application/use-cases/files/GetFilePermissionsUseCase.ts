import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { IFileRepository } from '@application/interfaces/IFileRepository';
import { IPermissionRepository } from '@application/interfaces/IPermissionRepository';
import { FileNotFoundError, UnauthorizedError } from '@domain/errors/DomainError';

export interface GetFilePermissionsInput {
    fileId: string;
    userId: string;
}

export interface GetFilePermissionsOutput {
    fileId: string;
    permissions: Array<{
        userEmail: string;
        permissionType: string;
    }>;
}

export class GetFilePermissionsUseCase {
    constructor(
        private readonly fileRepository: IFileRepository,
        private readonly permissionRepository: IPermissionRepository
    ) {}

    async execute(input: GetFilePermissionsInput): Promise<GetFilePermissionsOutput> {
        const fileId = FileId.fromString(input.fileId);
        const userId = UserId.fromString(input.userId);

        // Find file
        const file = await this.fileRepository.findById(fileId);
        if (!file) {
            throw new FileNotFoundError(input.fileId);
        }

        // Check ownership
        if (!file.isOwnedBy(userId)) {
            throw new UnauthorizedError('You do not have permission to view permissions for this file');
        }

        // Get all permissions for this file
        const permissions = await this.permissionRepository.getFilePermissions(fileId);

        return {
            fileId: file.getId().toString(),
            permissions: permissions.map(p => ({
                userEmail: p.userEmail,
                permissionType: p.permissionType,
            })),
        };
    }
}

