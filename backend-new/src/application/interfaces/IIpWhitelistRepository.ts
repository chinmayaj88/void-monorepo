import { UserId } from '@domain/value-objects/UserId';

export interface IpWhitelistEntry {
    id: string;
    userId: string;
    ipAddress: string;
    description: string | null;
    createdAt: Date;
    createdBy: string | null;
}

export interface IIpWhitelistRepository {
    isWhitelisted(userId: UserId, ipAddress: string): Promise<boolean>;
    add(userId: UserId, ipAddress: string, description: string | null, createdBy: UserId | null): Promise<void>;
    remove(userId: UserId, ipAddress: string): Promise<void>;
    list(userId: UserId): Promise<IpWhitelistEntry[]>;
}

