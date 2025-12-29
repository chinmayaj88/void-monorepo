import { Pool } from 'pg';
import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { IPermissionRepository, PermissionType } from '@application/interfaces/IPermissionRepository';
import { v4 as uuidv4 } from 'uuid';

interface PermissionRow {
    id: string;
    file_id: string;
    user_id: string;
    user_email: string;
    permission_type: string;
}

export class PermissionRepository implements IPermissionRepository {
    constructor(private readonly pool: Pool) {}

    async grantPermission(fileId: FileId, userEmail: Email, userId: UserId, permissionType: PermissionType): Promise<void> {
        // Store both user_id (for foreign key/data integrity) and user_email (for user-friendliness)
        await this.pool.query(
            `INSERT INTO file_permissions (id, file_id, user_id, user_email, permission_type)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (file_id, user_email) 
             DO UPDATE SET permission_type = $5, user_id = $3`,
            [uuidv4(), fileId.toString(), userId.toString(), userEmail.toString(), permissionType]
        );
    }

    async revokePermission(fileId: FileId, userEmail: Email): Promise<void> {
        await this.pool.query(
            'DELETE FROM file_permissions WHERE file_id = $1 AND user_email = $2',
            [fileId.toString(), userEmail.toString()]
        );
    }

    async hasPermission(fileId: FileId, userEmail: Email, permissionType: PermissionType): Promise<boolean> {
        const result = await this.pool.query<PermissionRow>(
            `SELECT * FROM file_permissions 
             WHERE file_id = $1 AND user_email = $2 AND permission_type = $3`,
            [fileId.toString(), userEmail.toString(), permissionType]
        );
        return result.rows.length > 0;
    }

    async getFilePermissions(fileId: FileId): Promise<Array<{ userEmail: string; permissionType: PermissionType }>> {
        const result = await this.pool.query<PermissionRow>(
            'SELECT * FROM file_permissions WHERE file_id = $1',
            [fileId.toString()]
        );
        return result.rows.map(row => ({
            userEmail: row.user_email,
            permissionType: row.permission_type as PermissionType,
        }));
    }

    async revokeAllPermissions(fileId: FileId): Promise<void> {
        await this.pool.query(
            'DELETE FROM file_permissions WHERE file_id = $1',
            [fileId.toString()]
        );
    }
}

