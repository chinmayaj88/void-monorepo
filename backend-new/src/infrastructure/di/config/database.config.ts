import { Pool } from 'pg';
import { Container } from '../Container';
import { DatabaseConnection } from '@infrastructure/database/DatabaseConnection';
import { UserRepository } from '@infrastructure/database/repositories/UserRepository';
import { DeviceRepository } from '@infrastructure/database/repositories/DeviceRepository';
import { SessionRepository } from '@infrastructure/database/repositories/SessionRepository';
import { PasswordHistoryRepository } from '@infrastructure/database/repositories/PasswordHistoryRepository';
import { IpWhitelistRepository } from '@infrastructure/database/repositories/IpWhitelistRepository';

export function configureDatabase(container: Container): void {
  // Database Pool (Singleton)
  const pool = DatabaseConnection.getPool();
  container.registerSingleton<Pool>('database.pool', pool);

  // Repositories
  container.register<UserRepository>('repository.user', () => {
    const pool = container.resolve<Pool>('database.pool');
    return new UserRepository(pool);
  });

  container.register<DeviceRepository>('repository.device', () => {
    const pool = container.resolve<Pool>('database.pool');
    return new DeviceRepository(pool);
  });

  container.register<SessionRepository>('repository.session', () => {
    const pool = container.resolve<Pool>('database.pool');
    return new SessionRepository(pool);
  });

  container.register<PasswordHistoryRepository>('repository.passwordHistory', () => {
    const pool = container.resolve<Pool>('database.pool');
    return new PasswordHistoryRepository(pool);
  });

  container.register<IpWhitelistRepository>('repository.ipWhitelist', () => {
    const pool = container.resolve<Pool>('database.pool');
    return new IpWhitelistRepository(pool);
  });
}

