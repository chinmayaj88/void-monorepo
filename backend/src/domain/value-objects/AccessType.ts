export type AccessType = 'private' | 'public' | 'link_shared' | 'shared';

export class AccessTypeVO {
    private constructor(private readonly value: AccessType) {}

    static create(value: AccessType): AccessTypeVO {
        if (!['private', 'public', 'link_shared', 'shared'].includes(value)) {
            throw new Error(`Invalid access type: ${value}`);
        }
        return new AccessTypeVO(value);
    }

    static fromString(value: string): AccessTypeVO {
        return this.create(value as AccessType);
    }

    toString(): AccessType {
        return this.value;
    }

    isPrivate(): boolean {
        return this.value === 'private';
    }

    isPublic(): boolean {
        return this.value === 'public';
    }

    isLinkShared(): boolean {
        return this.value === 'link_shared';
    }

    isShared(): boolean {
        return this.value === 'shared';
    }

    equals(other: AccessTypeVO): boolean {
        return this.value === other.value;
    }
}

