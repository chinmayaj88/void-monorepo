import argon2 from 'argon2';

export class PasswordHasher {
    private static readonly HASH_OPTIONS: argon2.Options & { raw?: false } = {
        type: argon2.argon2id,
        memoryCost: 65536,
        timeCost: 3,
        parallelism: 4,
        hashLength: 32,
        raw: false,
    };

    static async hash(plainPassword: string): Promise<string> {
        if (!plainPassword || plainPassword.trim().length === 0) {
            throw new Error('Password cannot be empty');
        }

        const trimmedPassword = plainPassword.trim();

        if (trimmedPassword.length < 8) {
            throw new Error('Password must be at least 8 characters long');
        }

        if (trimmedPassword.length > 100) {
            throw new Error('Password must be at most 100 characters long');
        }

        try {
            return await argon2.hash(trimmedPassword, this.HASH_OPTIONS);
        } catch (error) {
            throw new Error(`Failed to hash password: ${error}`);
        }
    }

    static async verify(hash: string, plainPassword: string): Promise<boolean> {
        if (!hash || !plainPassword) {
            return false;
        }

        const trimmedPassword = plainPassword.trim();

        if (trimmedPassword.length === 0) {
            return false;
        }

        try {
            return await argon2.verify(hash, trimmedPassword);
        } catch {
            return false;
        }
    }
}