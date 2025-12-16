import { VerifyTotpUseCase } from '@application/use-cases/auth/VerifyTotpUseCase';
import { MockUserRepository, createMockUser } from '../../../helpers/mockFactories';
import { SessionService } from '@infrastructure/encryption/SessionService';
import { TokenService } from '@infrastructure/encryption/TokenService';
import { InvalidTotpCodeError, InvalidCredentialsError } from '@domain/errors/DomainError';
import { authenticator } from 'otplib';

describe('VerifyTotpUseCase', () => {
  let useCase: VerifyTotpUseCase;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    useCase = new VerifyTotpUseCase(mockRepository);
  });

  afterEach(() => {
    mockRepository.clear();
  });

  describe('execute', () => {
    it('should verify valid TOTP code and return tokens', async () => {
      const totpSecret = authenticator.generateSecret();
      const user = createMockUser('user-123', 'test@example.com', 'password-hash', totpSecret);
      await mockRepository.save(user);

      const sessionToken = SessionService.createSession('user-123', 'test@example.com');
      const totpCode = authenticator.generate(totpSecret);

      const input = {
        sessionToken,
        totpCode,
      };

      const output = await useCase.execute(input);

      expect(output.userId).toBe('user-123');
      expect(output.email).toBe('test@example.com');
      expect(output.accessToken).toBeDefined();
      expect(output.refreshToken).toBeDefined();

      // Verify tokens are valid
      const accessPayload = TokenService.verifyAccessToken(output.accessToken);
      expect(accessPayload.userId).toBe('user-123');
      expect(accessPayload.email).toBe('test@example.com');
    });

    it('should delete session after successful verification', async () => {
      const totpSecret = authenticator.generateSecret();
      const user = createMockUser('user-123', 'test@example.com', 'password-hash', totpSecret);
      await mockRepository.save(user);

      const sessionToken = SessionService.createSession('user-123', 'test@example.com');
      const totpCode = authenticator.generate(totpSecret);

      const input = {
        sessionToken,
        totpCode,
      };

      await useCase.execute(input);

      // Session should be deleted
      const session = SessionService.getSession(sessionToken);
      expect(session).toBeNull();
    });

    it('should throw error for invalid TOTP code', async () => {
      const totpSecret = authenticator.generateSecret();
      const user = createMockUser('user-123', 'test@example.com', 'password-hash', totpSecret);
      await mockRepository.save(user);

      const sessionToken = SessionService.createSession('user-123', 'test@example.com');

      const input = {
        sessionToken,
        totpCode: '000000',
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidTotpCodeError);
    });

    it('should throw error for expired session', async () => {
      const totpSecret = authenticator.generateSecret();
      const user = createMockUser('user-123', 'test@example.com', 'password-hash', totpSecret);
      await mockRepository.save(user);

      const sessionToken = SessionService.createSession('user-123', 'test@example.com');
      SessionService.deleteSession(sessionToken);

      const input = {
        sessionToken,
        totpCode: '123456',
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw error for non-existent user', async () => {
      const sessionToken = SessionService.createSession('non-existent-user', 'test@example.com');

      const input = {
        sessionToken,
        totpCode: '123456',
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw error for wrong TOTP secret', async () => {
      const totpSecret1 = authenticator.generateSecret();
      const totpSecret2 = authenticator.generateSecret();
      const user = createMockUser('user-123', 'test@example.com', 'password-hash', totpSecret1);
      await mockRepository.save(user);

      const sessionToken = SessionService.createSession('user-123', 'test@example.com');
      const wrongTotpCode = authenticator.generate(totpSecret2);

      const input = {
        sessionToken,
        totpCode: wrongTotpCode,
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidTotpCodeError);
    });
  });
});

