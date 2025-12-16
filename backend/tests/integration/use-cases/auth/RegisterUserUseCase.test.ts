import { RegisterUserUseCase } from '@application/use-cases/auth/RegisterUserUseCase';
import { MockUserRepository, createMockUser } from '../../../helpers/mockFactories';
import { PasswordHasher } from '@infrastructure/encryption/PasswordHasher';
import { EmailAlreadyExistsError, InvalidEmailError } from '@domain/errors/DomainError';

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    useCase = new RegisterUserUseCase(mockRepository);
  });

  afterEach(() => {
    mockRepository.clear();
  });

  describe('execute', () => {
    it('should register a new user successfully', async () => {
      const passwordHash = await PasswordHasher.hash('SecurePass123!');
      const input = {
        email: 'newuser@example.com',
        passwordHash,
      };

      const output = await useCase.execute(input);

      expect(output.userId).toBeDefined();
      expect(output.email).toBe('newuser@example.com');
      expect(output.totpSecret).toBeDefined();
      expect(output.qrCodeUrl).toBeDefined();
      expect(output.qrCodeUrl).toContain('otpauth://');
    });

    it('should throw error if email already exists', async () => {
      const existingUser = createMockUser('user-1', 'existing@example.com');
      await mockRepository.save(existingUser);

      const passwordHash = await PasswordHasher.hash('SecurePass123!');
      const input = {
        email: 'existing@example.com',
        passwordHash,
      };

      await expect(useCase.execute(input)).rejects.toThrow(EmailAlreadyExistsError);
    });

    it('should throw error for invalid email format', async () => {
      const passwordHash = await PasswordHasher.hash('SecurePass123!');
      const input = {
        email: 'invalid-email',
        passwordHash,
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidEmailError);
    });

    it('should generate unique TOTP secrets for different users', async () => {
      const passwordHash = await PasswordHasher.hash('SecurePass123!');
      
      const output1 = await useCase.execute({
        email: 'user1@example.com',
        passwordHash,
      });

      const output2 = await useCase.execute({
        email: 'user2@example.com',
        passwordHash,
      });

      expect(output1.totpSecret).not.toBe(output2.totpSecret);
    });

    it('should generate unique user IDs', async () => {
      const passwordHash = await PasswordHasher.hash('SecurePass123!');
      
      const output1 = await useCase.execute({
        email: 'user1@example.com',
        passwordHash,
      });

      const output2 = await useCase.execute({
        email: 'user2@example.com',
        passwordHash,
      });

      expect(output1.userId).not.toBe(output2.userId);
    });

    it('should normalize email to lowercase', async () => {
      const passwordHash = await PasswordHasher.hash('SecurePass123!');
      const input = {
        email: 'TEST@EXAMPLE.COM',
        passwordHash,
      };

      const output = await useCase.execute(input);

      expect(output.email).toBe('test@example.com');
    });

    it('should save user to repository', async () => {
      const passwordHash = await PasswordHasher.hash('SecurePass123!');
      const input = {
        email: 'saved@example.com',
        passwordHash,
      };

      const output = await useCase.execute(input);

      const savedUser = await mockRepository.findByEmail(
        (await import('@domain/value-objects/Email')).Email.create('saved@example.com')
      );

      expect(savedUser).not.toBeNull();
      expect(savedUser?.getEmail().toString()).toBe('saved@example.com');
      expect(savedUser?.getTotpSecret()).toBe(output.totpSecret);
    });
  });
});

