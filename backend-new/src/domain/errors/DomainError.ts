export abstract class DomainError extends Error {
    constructor(message: string) {
        super(message);
        this.name = new.target.name;
        if (typeof (Error as any).captureStackTrace === 'function') {
            (Error as any).captureStackTrace(this, this.constructor);
        }
    }
}

export class InvalidEmailError extends DomainError {
    constructor(email: string) {
        super(`Invalid email format: ${email}`);
    }
}

export class UserNotFoundError extends DomainError {
    constructor(userId: string) {
        super(`User not found: ${userId}`);
    }
}

export class EmailAlreadyExistsError extends DomainError {
    constructor(email: string) {
        super(`Email already exists: ${email}`);
    }
}

export class InvalidCredentialsError extends DomainError {
    constructor() {
        super('Invalid email or password');
    }
}

export class InvalidTotpCodeError extends DomainError {
    constructor() {
        super('Invalid TOTP code');
    }
}

export class FileNotFoundError extends DomainError {
    constructor(fileId: string) {
        super(`File with ID ${fileId} not found`);
    }
}

export class UnauthorizedError extends DomainError {
    constructor(message: string = 'Unauthorized access') {
        super(message);
    }
}

export class ForbiddenError extends DomainError {
    constructor(message: string = 'Forbidden: Insufficient permissions') {
        super(message);
    }
}

export class DeviceLimitExceededError extends DomainError {
    constructor(maxDevices: number) {
        super(`Device limit exceeded. Maximum ${maxDevices} devices allowed.`);
    }
}

