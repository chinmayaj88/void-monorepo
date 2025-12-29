import { UserId } from '@domain/value-objects/UserId';

export interface PasswordHistoryEntry {
    id: string;
    userId: string;
    passwordHash: string;
    createdAt: Date;
}

export interface IPasswordHistoryRepository {
    save(userId: UserId, passwordHash: string): Promise<void>;
    getRecentPasswords(userId: UserId, limit: number): Promise<string[]>;
    clearOldPasswords(userId: UserId, keepCount: number): Promise<void>;
}

