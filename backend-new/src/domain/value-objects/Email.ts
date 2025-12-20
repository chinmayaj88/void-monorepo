export class Email {
    private constructor(private readonly value: string) {
        const trimmedValue = value.trim();
        if (!this.isValid(trimmedValue)) {
            throw new Error(`Invalid email format: ${value}`);
        }
    }

    static create(value: string): Email {
        return new Email(value);
    }

    static fromString(value: string): Email {
        return new Email(value);
    }

    private isValid(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    toString(): string {
        return this.value.toLowerCase().trim();
    }

    equals(other: Email): boolean {
        return this.toString() === other.toString();
    }
}

