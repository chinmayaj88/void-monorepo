export class FileId {
    private constructor(private readonly value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('FileId cannot be empty');
        }
    }

    static create(value: string): FileId {
        return new FileId(value);
    }

    static fromString(value: string): FileId {
        return new FileId(value);
    }

    toString(): string {
        return this.value;
    }

    equals(other: FileId): boolean {
        return this.value === other.value;
    }
}

