export class FileName {
    private constructor(private readonly value: string) {
        if (!value || value.trim().length === 0) {
            throw new Error('FileName cannot be empty');
        }
        
        if (value.length > 255) {
            throw new Error('FileName cannot exceed 255 characters');
        }

        if (value.includes('..') || value.includes('/') || value.includes('\\')) {
            throw new Error('FileName contains invalid characters');
        }
    }

    static create(value: string): FileName {
        return new FileName(value.trim());
    }

    static fromString(value: string): FileName {
        return new FileName(value);
    }

    toString(): string {
        return this.value;
    }

    equals(other: FileName): boolean {
        return this.value === other.value;
    }
}