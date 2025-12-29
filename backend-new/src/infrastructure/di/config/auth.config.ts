import { Container } from '../Container';
import { UserRepository } from '@infrastructure/database/repositories/UserRepository';
import { DeviceRepository } from '@infrastructure/database/repositories/DeviceRepository';
import { SessionRepository } from '@infrastructure/database/repositories/SessionRepository';
import { PasswordHistoryRepository } from '@infrastructure/database/repositories/PasswordHistoryRepository';
import { IpWhitelistRepository } from '@infrastructure/database/repositories/IpWhitelistRepository';
import { IIpWhitelistRepository } from '@application/interfaces/IIpWhitelistRepository';
import { EmailService, IEmailService } from '@infrastructure/email/EmailService';
import { RegisterUserUseCase } from '@application/use-cases/auth/RegisterUserUseCase';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase';
import { VerifyTotpUseCase } from '@application/use-cases/auth/VerifyTotpUseCase';
import { RefreshTokenUseCase } from '@application/use-cases/auth/RefreshTokenUseCase';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase';
import { RequestPasswordResetUseCase } from '@application/use-cases/auth/RequestPasswordResetUseCase';
import { ResetPasswordUseCase } from '@application/use-cases/auth/ResetPasswordUseCase';
import { VerifyEmailUseCase } from '@application/use-cases/auth/VerifyEmailUseCase';
import { ResendEmailVerificationUseCase } from '@application/use-cases/auth/ResendEmailVerificationUseCase';
import { ChangePasswordUseCase } from '@application/use-cases/auth/ChangePasswordUseCase';
import { VerifyDeviceUseCase } from '@application/use-cases/auth/VerifyDeviceUseCase';
import { ListDevicesUseCase } from '@application/use-cases/auth/ListDevicesUseCase';
import { RevokeDeviceUseCase } from '@application/use-cases/auth/RevokeDeviceUseCase';
import { SetupPrimaryDeviceUseCase } from '@application/use-cases/auth/SetupPrimaryDeviceUseCase';
import { SetupRecoveryEmailUseCase } from '@application/use-cases/auth/SetupRecoveryEmailUseCase';
import { VerifyRecoveryEmailUseCase } from '@application/use-cases/auth/VerifyRecoveryEmailUseCase';
import { RegenerateTotpUseCase } from '@application/use-cases/auth/RegenerateTotpUseCase';
import { GenerateTotpBackupCodesUseCase } from '@application/use-cases/auth/GenerateTotpBackupCodesUseCase';
import { AuthController } from '@presentation/http/controllers/AuthController';

export function configureAuth(container: Container): void {
  // Helper functions
  const getUserRepository = (): UserRepository =>
    container.resolve<UserRepository>('repository.user');
  const getDeviceRepository = (): DeviceRepository =>
    container.resolve<DeviceRepository>('repository.device');
  const getSessionRepository = (): SessionRepository =>
    container.resolve<SessionRepository>('repository.session');
  const getPasswordHistoryRepository = (): PasswordHistoryRepository =>
    container.resolve<PasswordHistoryRepository>('repository.passwordHistory');
  const getIpWhitelistRepository = (): IIpWhitelistRepository =>
    container.resolve<IIpWhitelistRepository>('repository.ipWhitelist');
  const getEmailService = (): IEmailService =>
    container.resolve<IEmailService>('service.email');

  // Email Service (Singleton)
  container.registerSingleton<IEmailService>('service.email', new EmailService());

  // Auth Use Cases
  container.register<RegisterUserUseCase>('usecase.registerUser', () => {
    return new RegisterUserUseCase(getUserRepository(), getEmailService());
  });

  container.register<LoginUseCase>('usecase.login', () => {
    return new LoginUseCase(
      getUserRepository(),
      getDeviceRepository(),
      getSessionRepository(),
      getEmailService(),
      getIpWhitelistRepository()
    );
  });

  container.register<VerifyTotpUseCase>('usecase.verifyTotp', () => {
    return new VerifyTotpUseCase(
      getUserRepository(),
      getDeviceRepository(),
      getSessionRepository()
    );
  });

  container.register<RefreshTokenUseCase>('usecase.refreshToken', () => {
    return new RefreshTokenUseCase(
      getUserRepository(),
      getSessionRepository(),
      getDeviceRepository()
    );
  });

  container.register<LogoutUseCase>('usecase.logout', () => {
    return new LogoutUseCase(getSessionRepository());
  });

  container.register<RequestPasswordResetUseCase>('usecase.requestPasswordReset', () => {
    return new RequestPasswordResetUseCase(getUserRepository(), getEmailService());
  });

  container.register<ResetPasswordUseCase>('usecase.resetPassword', () => {
    return new ResetPasswordUseCase(getUserRepository(), getSessionRepository());
  });

  container.register<VerifyEmailUseCase>('usecase.verifyEmail', () => {
    return new VerifyEmailUseCase(getUserRepository());
  });

  container.register<ResendEmailVerificationUseCase>('usecase.resendEmailVerification', () => {
    return new ResendEmailVerificationUseCase(getUserRepository(), getEmailService());
  });

  container.register<ChangePasswordUseCase>('usecase.changePassword', () => {
    return new ChangePasswordUseCase(
      getUserRepository(),
      getSessionRepository(),
      getPasswordHistoryRepository(),
      getEmailService()
    );
  });

  container.register<VerifyDeviceUseCase>('usecase.verifyDevice', () => {
    return new VerifyDeviceUseCase(getDeviceRepository());
  });

  container.register<ListDevicesUseCase>('usecase.listDevices', () => {
    return new ListDevicesUseCase(getDeviceRepository());
  });

  container.register<RevokeDeviceUseCase>('usecase.revokeDevice', () => {
    return new RevokeDeviceUseCase(getDeviceRepository(), getSessionRepository());
  });

  container.register<SetupPrimaryDeviceUseCase>('usecase.setupPrimaryDevice', () => {
    return new SetupPrimaryDeviceUseCase(getDeviceRepository());
  });

  container.register<SetupRecoveryEmailUseCase>('usecase.setupRecoveryEmail', () => {
    return new SetupRecoveryEmailUseCase(getUserRepository(), getEmailService());
  });

  container.register<VerifyRecoveryEmailUseCase>('usecase.verifyRecoveryEmail', () => {
    return new VerifyRecoveryEmailUseCase(getUserRepository());
  });

  container.register<RegenerateTotpUseCase>('usecase.regenerateTotp', () => {
    return new RegenerateTotpUseCase(getUserRepository());
  });

  container.register<GenerateTotpBackupCodesUseCase>('usecase.generateTotpBackupCodes', () => {
    return new GenerateTotpBackupCodesUseCase(getUserRepository());
  });

  // Auth Controller
  container.register<AuthController>('controller.auth', () => {
    return new AuthController(
      container.resolve<RegisterUserUseCase>('usecase.registerUser'),
      container.resolve<LoginUseCase>('usecase.login'),
      container.resolve<VerifyTotpUseCase>('usecase.verifyTotp'),
      container.resolve<RefreshTokenUseCase>('usecase.refreshToken'),
      container.resolve<LogoutUseCase>('usecase.logout'),
      container.resolve<RequestPasswordResetUseCase>('usecase.requestPasswordReset'),
      container.resolve<ResetPasswordUseCase>('usecase.resetPassword'),
      container.resolve<VerifyEmailUseCase>('usecase.verifyEmail'),
      container.resolve<ResendEmailVerificationUseCase>('usecase.resendEmailVerification'),
      container.resolve<ChangePasswordUseCase>('usecase.changePassword'),
      container.resolve<VerifyDeviceUseCase>('usecase.verifyDevice'),
      container.resolve<ListDevicesUseCase>('usecase.listDevices'),
      container.resolve<RevokeDeviceUseCase>('usecase.revokeDevice'),
      container.resolve<SetupPrimaryDeviceUseCase>('usecase.setupPrimaryDevice'),
      container.resolve<SetupRecoveryEmailUseCase>('usecase.setupRecoveryEmail'),
      container.resolve<VerifyRecoveryEmailUseCase>('usecase.verifyRecoveryEmail'),
      container.resolve<RegenerateTotpUseCase>('usecase.regenerateTotp'),
      container.resolve<GenerateTotpBackupCodesUseCase>('usecase.generateTotpBackupCodes')
    );
  });
}

