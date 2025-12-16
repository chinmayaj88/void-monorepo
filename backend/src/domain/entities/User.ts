import { UserId } from "../value-objects/UserId";
import { Email } from "../value-objects/Email";

export class User {
    private constructor(
        private readonly id: UserId,
        private email: Email,
        private passwordHash: string,
        private totpSecret: string,
        private readonly createdAt: Date,
        private updatedAt: Date
    ) {
        this.validate();
    }

    static create(
        id: UserId,
        email: Email,
        passwordHash: string,
        totpSecret: string
    ): User {
        const now = new Date();
        return new User(id, email, passwordHash, totpSecret, now, now);
    }

    static reconstitute(
        id: UserId,
        email: Email,
        passwordHash: string,
        totpSecret: string,
        createdAt: Date,
        updatedAt: Date,
    ): User {
        return new User(id, email, passwordHash, totpSecret, createdAt, updatedAt);
    }

    private validate(): void {
        if (this.isEmpty(this.passwordHash)) {
            throw new Error('Password hash cannot be empty');
        }

        if (this.isEmpty(this.totpSecret)) {
            throw new Error('TOTP secret cannot be empty');
        }
    }

    private isEmpty(value: string): boolean {
        return !value || value.trim().length === 0;
    }

    getId(): UserId {
        return this.id;
    }

    getEmail(): Email {
        return this.email;
    }

    getPasswordHash(): string {
        return this.passwordHash;
    }

    getTotpSecret(): string {
        return this.totpSecret;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    getUpdatedAt(): Date {
        return this.updatedAt;
    }

    updateEmail(newEmail: Email): void {
        this.email = newEmail;
        this.updatedAt = new Date();
    }

    updatePassword(newPasswordHash: string): void {
        if (this.isEmpty(newPasswordHash)) {
            throw new Error('Password hash cannot be empty');
        }
        this.passwordHash = newPasswordHash;
        this.updatedAt = new Date();
    }

    equals(other: User): boolean {
        return this.id.equals(other.id);
    }
}