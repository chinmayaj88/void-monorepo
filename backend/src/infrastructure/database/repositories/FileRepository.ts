import { Pool } from 'pg';
import { File } from '@domain/entities/File';
import { FileId } from '@domain/value-objects/FileId';
import { UserId } from '@domain/value-objects/UserId';
import { FileName } from '@domain/value-objects/FileName';
import { FolderId } from '@domain/value-objects/FolderId';
import { AccessTypeVO } from '@domain/value-objects/AccessType';
import { IFileRepository } from '@application/interfaces/IFileRepository';

interface FileRow {
    id: string;
    owner_id: string;
    name: string;
    size: number;
    mime_type: string | null;
    oci_object_key: string;
    storage_tier: string;
    is_folder: boolean;
    parent_folder_id: string | null;
    access_type: string;
    share_token: string | null;
    created_at: Date;
    updated_at: Date;
    last_accessed_at: Date | null;
    access_count: number;
}

export class FileRepository implements IFileRepository {
    constructor(private readonly pool: Pool) {}

    async save(file: File): Promise<void> {
        const client = await this.pool.connect();
        try {
            const exists = await this.findById(file.getId());
            
            if (exists) {
                await client.query(
                    `UPDATE files 
                     SET name = $1, size = $2, parent_folder_id = $3, access_type = $4, share_token = $5, storage_tier = $6, updated_at = $7
                     WHERE id = $8`,
                    [
                        file.getName().toString(),
                        file.getSize(),
                        file.getParentFolderId()?.toString() || null,
                        file.getAccessType().toString(),
                        file.getShareToken(),
                        file.getStorageTier(),
                        file.getUpdatedAt(),
                        file.getId().toString(),
                    ]
                );
            } else {
                await client.query(
                    `INSERT INTO files (id, owner_id, name, size, mime_type, oci_object_key, storage_tier, is_folder, parent_folder_id, access_type, share_token, created_at, updated_at, last_accessed_at, access_count)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                    [
                        file.getId().toString(),
                        file.getOwnerId().toString(),
                        file.getName().toString(),
                        file.getSize(),
                        file.getMimeType(),
                        file.getOciObjectKey(),
                        file.getStorageTier(),
                        file.getIsFolder(),
                        file.getParentFolderId()?.toString() || null,
                        file.getAccessType().toString(),
                        file.getShareToken(),
                        file.getCreatedAt(),
                        file.getUpdatedAt(),
                        file.getCreatedAt(), // Initialize last_accessed_at to created_at
                        0, // Initialize access_count to 0
                    ]
                );
            }
        } finally {
            client.release();
        }
    }

    async findById(id: FileId): Promise<File | null> {
        const result = await this.pool.query<FileRow>(
            'SELECT * FROM files WHERE id = $1',
            [id.toString()]
        );

        return this.mapFirstRow(result);
    }

    async findByOwnerId(ownerId: UserId, parentFolderId?: FileId | null): Promise<File[]> {
        if (parentFolderId !== undefined) {
            const result = await this.pool.query<FileRow>(
                'SELECT * FROM files WHERE owner_id = $1 AND (parent_folder_id = $2 OR ($2 IS NULL AND parent_folder_id IS NULL)) ORDER BY is_folder DESC, name ASC',
                [ownerId.toString(), parentFolderId?.toString() || null]
            );
            return result.rows.map(row => this.mapRowToFile(row));
        } else {
            const result = await this.pool.query<FileRow>(
                'SELECT * FROM files WHERE owner_id = $1 ORDER BY is_folder DESC, name ASC',
                [ownerId.toString()]
            );
            return result.rows.map(row => this.mapRowToFile(row));
        }
    }

    async findByFolderId(folderId: FolderId): Promise<File[]> {
        const result = await this.pool.query<FileRow>(
            'SELECT * FROM files WHERE parent_folder_id = $1 ORDER BY is_folder DESC, name ASC',
            [folderId.toString()]
        );
        return result.rows.map(row => this.mapRowToFile(row));
    }

    async findByShareToken(shareToken: string): Promise<File | null> {
        const result = await this.pool.query<FileRow>(
            'SELECT * FROM files WHERE share_token = $1',
            [shareToken]
        );
        return this.mapFirstRow(result);
    }

    async findFolderById(id: FileId): Promise<File | null> {
        const result = await this.pool.query<FileRow>(
            'SELECT * FROM files WHERE id = $1 AND is_folder = TRUE',
            [id.toString()]
        );
        return this.mapFirstRow(result);
    }

    async delete(id: FileId): Promise<void> {
        await this.pool.query('DELETE FROM files WHERE id = $1', [id.toString()]);
    }

    async existsById(id: FileId): Promise<boolean> {
        const result = await this.pool.query(
            'SELECT 1 FROM files WHERE id = $1 LIMIT 1',
            [id.toString()]
        );

        return result.rows.length > 0;
    }

    async recordAccess(fileId: FileId): Promise<void> {
        await this.pool.query(
            `UPDATE files 
             SET last_accessed_at = CURRENT_TIMESTAMP, 
                 access_count = access_count + 1
             WHERE id = $1`,
            [fileId.toString()]
        );
    }

    async updateStorageTier(fileId: FileId, storageTier: 'standard' | 'archive'): Promise<void> {
        await this.pool.query(
            `UPDATE files 
             SET storage_tier = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [storageTier, fileId.toString()]
        );
    }

    async findFilesForAutoArchive(daysSinceAccess: number, limit: number = 100): Promise<File[]> {
        const result = await this.pool.query<FileRow>(
            `SELECT * FROM files 
             WHERE is_folder = FALSE 
               AND storage_tier = 'standard'
               AND last_accessed_at < CURRENT_TIMESTAMP - INTERVAL '${daysSinceAccess} days'
             ORDER BY last_accessed_at ASC
             LIMIT $1`,
            [limit]
        );
        return result.rows.map(row => this.mapRowToFile(row));
    }

    async getStorageStats(ownerId?: UserId): Promise<{
        totalFiles: number;
        totalSize: number;
        standardSize: number;
        archiveSize: number;
        standardFiles: number;
        archiveFiles: number;
    }> {
        let query: string;
        let params: string[];

        if (ownerId) {
            query = `
                SELECT 
                    COUNT(*) FILTER (WHERE is_folder = FALSE) as total_files,
                    COALESCE(SUM(size), 0) as total_size,
                    COALESCE(SUM(size) FILTER (WHERE storage_tier = 'standard' AND is_folder = FALSE), 0) as standard_size,
                    COALESCE(SUM(size) FILTER (WHERE storage_tier = 'archive' AND is_folder = FALSE), 0) as archive_size,
                    COUNT(*) FILTER (WHERE storage_tier = 'standard' AND is_folder = FALSE) as standard_files,
                    COUNT(*) FILTER (WHERE storage_tier = 'archive' AND is_folder = FALSE) as archive_files
                FROM files
                WHERE owner_id = $1
            `;
            params = [ownerId.toString()];
        } else {
            query = `
                SELECT 
                    COUNT(*) FILTER (WHERE is_folder = FALSE) as total_files,
                    COALESCE(SUM(size), 0) as total_size,
                    COALESCE(SUM(size) FILTER (WHERE storage_tier = 'standard' AND is_folder = FALSE), 0) as standard_size,
                    COALESCE(SUM(size) FILTER (WHERE storage_tier = 'archive' AND is_folder = FALSE), 0) as archive_size,
                    COUNT(*) FILTER (WHERE storage_tier = 'standard' AND is_folder = FALSE) as standard_files,
                    COUNT(*) FILTER (WHERE storage_tier = 'archive' AND is_folder = FALSE) as archive_files
                FROM files
            `;
            params = [];
        }

        const result = await this.pool.query(query, params);
        const row = result.rows[0];

        return {
            totalFiles: parseInt(row.total_files, 10),
            totalSize: parseInt(row.total_size, 10),
            standardSize: parseInt(row.standard_size, 10),
            archiveSize: parseInt(row.archive_size, 10),
            standardFiles: parseInt(row.standard_files, 10),
            archiveFiles: parseInt(row.archive_files, 10),
        };
    }

    private mapFirstRow(result: { rows: FileRow[] }): File | null {
        if (result.rows.length === 0) {
            return null;
        }
        return this.mapRowToFile(result.rows[0]);
    }

    private mapRowToFile(row: FileRow): File {
        // Note: last_accessed_at and access_count are tracked in DB but not in File entity
        // They're used for archiving decisions but don't affect domain logic
        return File.reconstitute(
            FileId.fromString(row.id),
            UserId.fromString(row.owner_id),
            FileName.fromString(row.name),
            Number(row.size),
            row.mime_type,
            row.oci_object_key,
            row.storage_tier as 'standard' | 'archive',
            row.is_folder,
            row.parent_folder_id ? FileId.fromString(row.parent_folder_id) : null,
            AccessTypeVO.fromString(row.access_type),
            row.share_token,
            row.created_at,
            row.updated_at
        );
    }
}
