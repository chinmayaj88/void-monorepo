import { File } from "@domain/entities/File";
import { FileId } from "@domain/value-objects/FileId";
import { UserId } from "@domain/value-objects/UserId";
import { FolderId } from "@domain/value-objects/FolderId";

export interface IFileRepository {
    save(file: File): Promise<void>;
    findById(id: FileId): Promise<File | null>;
    findByOwnerId(ownerId: UserId, parentFolderId?: FileId | null): Promise<File[]>;
    findByFolderId(folderId: FolderId): Promise<File[]>;
    findByShareToken(shareToken: string): Promise<File | null>;
    delete(id: FileId): Promise<void>;
    existsById(id: FileId): Promise<boolean>;
    findFolderById(id: FileId): Promise<File | null>;
    // Access tracking
    recordAccess(fileId: FileId): Promise<void>;
    // Archive operations
    updateStorageTier(fileId: FileId, storageTier: 'standard' | 'archive'): Promise<void>;
    findFilesForAutoArchive(daysSinceAccess: number, limit?: number): Promise<File[]>;
    // Storage stats
    getStorageStats(ownerId?: UserId): Promise<{
        totalFiles: number;
        totalSize: number;
        standardSize: number;
        archiveSize: number;
        standardFiles: number;
        archiveFiles: number;
    }>;
}
