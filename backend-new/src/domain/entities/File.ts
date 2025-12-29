import { FileId } from '../value-objects/FileId';
import { UserId } from '../value-objects/UserId';
import { FileName } from '../value-objects/FileName';
import { AccessTypeVO } from '../value-objects/AccessType';

export type StorageTier = 'standard' | 'archive';

export class File {
    private constructor(
        private readonly id: FileId,
        private readonly ownerId: UserId,
        private name: FileName,
        private readonly size: number,
        private readonly mimeType: string | null,
        private readonly ociObjectKey: string,
        private readonly storageTier: StorageTier,
        private readonly isFolder: boolean,
        private readonly parentFolderId: FileId | null,
        private readonly accessType: AccessTypeVO,
        private readonly shareToken: string | null,
        private readonly createdAt: Date,
        private updatedAt: Date,
        private lastAccessedAt: Date | null = null,
        private accessCount: number = 0
    ) {
        this.validate();
    }

    static createFile(
        id: FileId,
        ownerId: UserId,
        name: FileName,
        size: number,
        mimeType: string | null,
        ociObjectKey: string,
        parentFolderId: FileId | null = null,
        storageTier: StorageTier = 'standard',
        accessType: AccessTypeVO = AccessTypeVO.create('private')
    ): File {
        const now = new Date();
        return new File(
            id,
            ownerId,
            name,
            size,
            mimeType,
            ociObjectKey,
            storageTier,
            false,
            parentFolderId,
            accessType,
            null,
            now,
            now
        );
    }

    static createFolder(
        id: FileId,
        ownerId: UserId,
        name: FileName,
        parentFolderId: FileId | null = null,
        accessType: AccessTypeVO = AccessTypeVO.create('private')
    ): File {
        const now = new Date();
        return new File(
            id,
            ownerId,
            name,
            0,
            null,
            '', // Folders don't have OCI object keys
            'standard',
            true,
            parentFolderId,
            accessType,
            null,
            now,
            now
        );
    }

    static reconstitute(
        id: FileId,
        ownerId: UserId,
        name: FileName,
        size: number,
        mimeType: string | null,
        ociObjectKey: string,
        storageTier: StorageTier,
        isFolder: boolean,
        parentFolderId: FileId | null,
        accessType: AccessTypeVO,
        shareToken: string | null,
        createdAt: Date,
        updatedAt: Date,
        lastAccessedAt: Date | null = null,
        accessCount: number = 0
    ): File {
        return new File(
            id,
            ownerId,
            name,
            size,
            mimeType,
            ociObjectKey,
            storageTier,
            isFolder,
            parentFolderId,
            accessType,
            shareToken,
            createdAt,
            updatedAt,
            lastAccessedAt,
            accessCount
        );
    }

    private validate(): void {
        if (this.isFolder) {
            // Folders must have empty ociObjectKey and size 0
            if (this.ociObjectKey !== '' || this.size !== 0) {
                throw new Error('Folders must have empty OCI object key and size 0');
            }
        } else {
            // Files must have non-empty ociObjectKey
            if (!this.ociObjectKey || this.ociObjectKey.trim().length === 0) {
                throw new Error('Files must have a non-empty OCI object key');
            }
            if (this.size < 0) {
                throw new Error('File size cannot be negative');
            }
            if (this.size > 5 * 1024 * 1024 * 1024) { // 5GB max
                throw new Error('File size cannot exceed 5GB');
            }
        }
    }

    getId(): FileId {
        return this.id;
    }

    getOwnerId(): UserId {
        return this.ownerId;
    }

    getName(): FileName {
        return this.name;
    }

    getSize(): number {
        return this.size;
    }

    getMimeType(): string | null {
        return this.mimeType;
    }

    getOciObjectKey(): string {
        return this.ociObjectKey;
    }

    getStorageTier(): StorageTier {
        return this.storageTier;
    }

    getIsFolder(): boolean {
        return this.isFolder;
    }

    getParentFolderId(): FileId | null {
        return this.parentFolderId;
    }

    getAccessType(): AccessTypeVO {
        return this.accessType;
    }

    getShareToken(): string | null {
        return this.shareToken;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    getLastAccessedAt(): Date | null {
        return this.lastAccessedAt;
    }

    getAccessCount(): number {
        return this.accessCount;
    }

    updateName(newName: FileName): void {
        this.name = newName;
        this.updatedAt = new Date();
    }

    moveToFolder(newParentFolderId: FileId | null): File {
        return File.reconstitute(
            this.id,
            this.ownerId,
            this.name,
            this.size,
            this.mimeType,
            this.ociObjectKey,
            this.storageTier,
            this.isFolder,
            newParentFolderId,
            this.accessType,
            this.shareToken,
            this.createdAt,
            new Date(),
            this.lastAccessedAt,
            this.accessCount
        );
    }

    updateAccessType(newAccessType: AccessTypeVO): File {
        return File.reconstitute(
            this.id,
            this.ownerId,
            this.name,
            this.size,
            this.mimeType,
            this.ociObjectKey,
            this.storageTier,
            this.isFolder,
            this.parentFolderId,
            newAccessType,
            this.shareToken,
            this.createdAt,
            new Date(),
            this.lastAccessedAt,
            this.accessCount
        );
    }

    setShareToken(token: string | null): File {
        return File.reconstitute(
            this.id,
            this.ownerId,
            this.name,
            this.size,
            this.mimeType,
            this.ociObjectKey,
            this.storageTier,
            this.isFolder,
            this.parentFolderId,
            this.accessType,
            token,
            this.createdAt,
            new Date(),
            this.lastAccessedAt,
            this.accessCount
        );
    }

    updateStorageTier(newStorageTier: StorageTier): File {
        return File.reconstitute(
            this.id,
            this.ownerId,
            this.name,
            this.size,
            this.mimeType,
            this.ociObjectKey,
            newStorageTier,
            this.isFolder,
            this.parentFolderId,
            this.accessType,
            this.shareToken,
            this.createdAt,
            new Date(),
            this.lastAccessedAt,
            this.accessCount
        );
    }

    updateLastAccessedAt(): File {
        return File.reconstitute(
            this.id,
            this.ownerId,
            this.name,
            this.size,
            this.mimeType,
            this.ociObjectKey,
            this.storageTier,
            this.isFolder,
            this.parentFolderId,
            this.accessType,
            this.shareToken,
            this.createdAt,
            new Date(),
            new Date(), // lastAccessedAt
            this.accessCount + 1 // increment access count
        );
    }

    isOwnedBy(userId: UserId): boolean {
        return this.ownerId.equals(userId);
    }

    isInFolder(folderId: FileId): boolean {
        return this.parentFolderId?.equals(folderId) ?? false;
    }

    equals(other: File): boolean {
        return this.id.equals(other.id);
    }
}

