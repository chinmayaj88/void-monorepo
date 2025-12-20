import { FileId } from "@domain/value-objects/FileId";
import { UserId } from "@domain/value-objects/UserId";
import { Email } from "@domain/value-objects/Email";

export type PermissionType = 'read' | 'write' | 'delete';

export interface IPermissionRepository {
    // Accepts email (user-friendly) and userId (for data integrity)
    // Both are stored: email for display, userId for foreign key
    grantPermission(fileId: FileId, userEmail: Email, userId: UserId, permissionType: PermissionType): Promise<void>;
    revokePermission(fileId: FileId, userEmail: Email): Promise<void>;
    hasPermission(fileId: FileId, userEmail: Email, permissionType: PermissionType): Promise<boolean>;
    getFilePermissions(fileId: FileId): Promise<Array<{ userEmail: string; permissionType: PermissionType }>>;
    revokeAllPermissions(fileId: FileId): Promise<void>;
}

