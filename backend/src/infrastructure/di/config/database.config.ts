import { Pool } from 'pg';
import { Container } from '../Container';
import { DatabaseConnection } from '@infrastructure/database/DatabaseConnection';
import { UserRepository } from '@infrastructure/database/repositories/UserRepository';
import { FileRepository } from '@infrastructure/database/repositories/FileRepository';
import { PermissionRepository } from '@infrastructure/database/repositories/PermissionRepository';
import { DeviceRepository } from '@infrastructure/database/repositories/DeviceRepository';
import { SessionRepository } from '@infrastructure/database/repositories/SessionRepository';

export function configureDatabase(container: Container): void {
  // Database Pool (Singleton)
  const pool = DatabaseConnection.getPool();
  container.registerSingleton<Pool>('database.pool', pool);

  // Repositories
  container.register<UserRepository>('repository.user', () => {
    const pool = container.resolve<Pool>('database.pool');
    return new UserRepository(pool);
  });

  container.register<FileRepository>('repository.file', () => {
    const pool = container.resolve<Pool>('database.pool');
    return new FileRepository(pool);
  });

  container.register<PermissionRepository>('repository.permission', () => {
    const pool = container.resolve<Pool>('database.pool');
    return new PermissionRepository(pool);
  });

  container.register<DeviceRepository>('repository.device', () => {
    const pool = container.resolve<Pool>('database.pool');
    return new DeviceRepository(pool);
  });

  container.register<SessionRepository>('repository.session', () => {
    const pool = container.resolve<Pool>('database.pool');
    return new SessionRepository(pool);
  });
}

