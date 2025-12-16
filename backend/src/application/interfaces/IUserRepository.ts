import { User } from "@domain/entities/User";
import { UserId } from "@domain/value-objects/UserId";
import { Email } from "@domain/value-objects/Email";

export interface IUserRepository {
    save(user: User): Promise<void>;
    findById(id: UserId): Promise<User | null>;
    findByEmail(email: Email): Promise<User | null>;
    existsByEmail(email: Email): Promise<boolean>;
    delete(id: UserId): Promise<void>;
}