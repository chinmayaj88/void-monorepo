import { User } from '@domain/entities/User';
import { UserId } from '@domain/value-objects/UserId';
import { Email } from '@domain/value-objects/Email';
import { IUserRepository } from '@application/interfaces/IUserRepository';

export class MockUserRepository implements IUserRepository {
  private users = new Map<string, User>();

  async save(user: User): Promise<void> {
    this.users.set(user.getId().toString(), user);
  }

  async findById(id: UserId): Promise<User | null> {
    return this.users.get(id.toString()) || null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.getEmail().equals(email)) {
        return user;
      }
    }
    return null;
  }

  async existsByEmail(email: Email): Promise<boolean> {
    return (await this.findByEmail(email)) !== null;
  }

  async delete(id: UserId): Promise<void> {
    this.users.delete(id.toString());
  }

  clear(): void {
    this.users.clear();
  }
}

export function createMockUser(
  id: string = 'user-123',
  email: string = 'test@example.com',
  passwordHash: string = 'mock-password-hash',
  totpSecret: string = 'mock-totp-secret'
): User {
  return User.create(
    UserId.create(id),
    Email.create(email),
    passwordHash,
    totpSecret
  );
}

