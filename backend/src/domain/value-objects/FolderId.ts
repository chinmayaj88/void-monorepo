import { FileId } from './FileId';

export class FolderId {
    private constructor(private readonly value: FileId) {}

    static create(fileId: FileId): FolderId {
        return new FolderId(fileId);
    }

    static fromString(value: string): FolderId {
        return new FolderId(FileId.fromString(value));
    }

    getFileId(): FileId {
        return this.value;
    }

    toString(): string {
        return this.value.toString();
    }

    equals(other: FolderId): boolean {
        return this.value.equals(other.value);
    }
}

