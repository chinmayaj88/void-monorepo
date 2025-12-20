export type RoleType = 'admin' | 'user';

export class Role {
    private constructor(private readonly value: RoleType) {
        if (!['admin', 'user'].includes(value)) {
            throw new Error(`Invalid role: ${value}`);
        }
    }

    static create(value: RoleType): Role {
        return new Role(value);
    }

    static admin(): Role {
        return new Role('admin');
    }

    static user(): Role {
        return new Role('user');
    }

    static fromString(value: string): Role {
        if (value !== 'admin' && value !== 'user') {
            throw new Error(`Invalid role: ${value}`);
        }
        return new Role(value as RoleType);
    }

    toString(): RoleType {
        return this.value;
    }

    isAdmin(): boolean {
        return this.value === 'admin';
    }

    isUser(): boolean {
        return this.value === 'user';
    }

    equals(other: Role): boolean {
        return this.value === other.value;
    }
}

