import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase';
import { MockUserRepository, createMockUser } from '../../../helpers/mockFactories';
import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';
import { InvalidCredentialsError } from '@domain/errors/DomainError';
import { SessionService } from '@infrastructure/encryption/SessionService';

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    useCase = new LoginUseCase(mockRepository);
  });

  afterEach(() => {
    mockRepository.clear();
  });

  describe('execute', () => {
    it('should verify correct credentials and return session token', async () => {
      const password = 'SecurePass123!';
      const passwordHash = await PasswordHasher.hash(password);
      const user = createMockUser('user-123', 'test@example.com', passwordHash);
      await mockRepository.save(user);

      const input = {
        email: 'test@example.com',
        password,
      };

      const output = await useCase.execute(input);

      expect(output.sessionToken).toBeDefined();
      expect(output.expiresIn).toBe(180);
      
      // Verify session was created
      const session = SessionService.getSession(output.sessionToken);
      expect(session).not.toBeNull();
      expect(session?.userId).toBe('user-123');
      expect(session?.email).toBe('test@example.com');
    });

    it('should throw error for non-existent user', async () => {
      const input = {
        email: 'nonexistent@example.com',
        password: 'SecurePass123!',
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw error for incorrect password', async () => {
      const passwordHash = await PasswordHasher.hash('SecurePass123!');
      const user = createMockUser('user-123', 'test@example.com', passwordHash);
      await mockRepository.save(user);

      const input = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw error for invalid email format', async () => {
      const input = {
        email: 'invalid-email',
        password: 'SecurePass123!',
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should handle email case insensitivity', async () => {
      const password = 'SecurePass123!';
      const passwordHash = await PasswordHasher.hash(password);
      const user = createMockUser('user-123', 'test@example.com', passwordHash);
      await mockRepository.save(user);

      const input = {
        email: 'TEST@EXAMPLE.COM',
        password,
      };

      const output = await useCase.execute(input);
      expect(output.sessionToken).toBeDefined();
    });

    it('should trim password before verification', async () => {
      const password = 'SecurePass123!';
      const passwordHash = await PasswordHasher.hash(password);
      const user = createMockUser('user-123', 'test@example.com', passwordHash);
      await mockRepository.save(user);

      const input = {
        email: 'test@example.com',
        password: '  SecurePass123!  ',
      };

      const output = await useCase.execute(input);
      expect(output.sessionToken).toBeDefined();
    });
  });
});

