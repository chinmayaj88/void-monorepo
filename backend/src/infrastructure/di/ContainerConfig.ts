import { Pool } from 'pg';
import { Container } from './Container';
import { DatabaseConnection } from '@infrastructure/database/DatabaseConnection';
import { UserRepository } from '@infrastructure/database/repositories/UserRepository';
import { RegisterUserUseCase } from '@application/use-cases/auth/RegisterUserUseCase';
import { VerifyCredentialsUseCase } from '@application/use-cases/auth/VerifyCredentialsUseCase';
import { VerifyTotpUseCase } from '@application/use-cases/auth/VerifyTotpUseCase';
import { RefreshTokenUseCase } from '@application/use-cases/auth/RefreshTokenUseCase';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase';
import { AuthController } from '@presentation/http/controllers/AuthController';

export function configureContainer(): Container {
  const container = new Container();

  const pool = DatabaseConnection.getPool();
  container.registerSingleton<Pool>('database.pool', pool);

  container.register<UserRepository>('repository.user', () => {
    const pool = container.resolve<Pool>('database.pool');
    return new UserRepository(pool);
  });

  const getUserRepository = (): UserRepository =>
    container.resolve<UserRepository>('repository.user');

  container.register<RegisterUserUseCase>('usecase.registerUser', () => {
    return new RegisterUserUseCase(getUserRepository());
  });

  container.register<VerifyCredentialsUseCase>('usecase.verifyCredentials', () => {
    return new VerifyCredentialsUseCase(getUserRepository());
  });

  container.register<VerifyTotpUseCase>('usecase.verifyTotp', () => {
    return new VerifyTotpUseCase(getUserRepository());
  });

  container.register<RefreshTokenUseCase>('usecase.refreshToken', () => {
    return new RefreshTokenUseCase(getUserRepository());
  });

  container.register<LogoutUseCase>('usecase.logout', () => {
    return new LogoutUseCase();
  });

  container.register<AuthController>('controller.auth', () => {
    return new AuthController(
      container.resolve<RegisterUserUseCase>('usecase.registerUser'),
      container.resolve<VerifyCredentialsUseCase>('usecase.verifyCredentials'),
      container.resolve<VerifyTotpUseCase>('usecase.verifyTotp'),
      container.resolve<RefreshTokenUseCase>('usecase.refreshToken'),
      container.resolve<LogoutUseCase>('usecase.logout')
    );
  });

  return container;
}
