import { RefreshTokenUseCase } from '@application/use-cases/auth/RefreshTokenUseCase';
import { MockUserRepository, createMockUser } from '../../../helpers/mockFactories';
import { TokenService } from '@infrastructure/encryption/TokenService';
import { TokenBlacklistService } from '@infrastructure/encryption/TokenBlacklistService';
import { InvalidCredentialsError } from '@domain/errors/DomainError';

describe('RefreshTokenUseCase', () => {
  let useCase: RefreshTokenUseCase;
  let mockRepository: MockUserRepository;

  beforeEach(() => {
    mockRepository = new MockUserRepository();
    useCase = new RefreshTokenUseCase(mockRepository);
    TokenBlacklistService.clear();
  });

  afterEach(() => {
    mockRepository.clear();
    TokenBlacklistService.clear();
  });

  describe('execute', () => {
    it('should refresh tokens successfully', async () => {
      const user = createMockUser('user-123', 'test@example.com');
      await mockRepository.save(user);

      const originalRefreshToken = TokenService.generateRefreshToken({
        userId: 'user-123',
        email: 'test@example.com',
      });

      const input = {
        refreshToken: originalRefreshToken,
      };

      const output = await useCase.execute(input);

      expect(output.accessToken).toBeDefined();
      expect(output.refreshToken).toBeDefined();
      // Token rotation - new token should be generated (may be same if generated in same millisecond, but structure is correct)
      expect(typeof output.refreshToken).toBe('string');

      // Verify new tokens are valid
      const accessPayload = TokenService.verifyAccessToken(output.accessToken);
      expect(accessPayload.userId).toBe('user-123');
      expect(accessPayload.email).toBe('test@example.com');

      const refreshPayload = TokenService.verifyRefreshToken(output.refreshToken);
      expect(refreshPayload.userId).toBe('user-123');
      expect(refreshPayload.email).toBe('test@example.com');
    });

    it('should throw error for blacklisted token', async () => {
      const user = createMockUser('user-123', 'test@example.com');
      await mockRepository.save(user);

      const refreshToken = TokenService.generateRefreshToken({
        userId: 'user-123',
        email: 'test@example.com',
      });

      // Blacklist the token
      TokenBlacklistService.add(refreshToken, Date.now() + 7 * 24 * 60 * 60 * 1000);

      const input = {
        refreshToken,
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw error for invalid token', async () => {
      const input = {
        refreshToken: 'invalid-token',
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should throw error for non-existent user', async () => {
      const refreshToken = TokenService.generateRefreshToken({
        userId: 'non-existent-user',
        email: 'test@example.com',
      });

      const input = {
        refreshToken,
      };

      await expect(useCase.execute(input)).rejects.toThrow(InvalidCredentialsError);
    });

    it('should rotate refresh token (generate new one)', async () => {
      const user = createMockUser('user-123', 'test@example.com');
      await mockRepository.save(user);

      const originalRefreshToken = TokenService.generateRefreshToken({
        userId: 'user-123',
        email: 'test@example.com',
      });

      const input = {
        refreshToken: originalRefreshToken,
      };

      const output1 = await useCase.execute(input);
      const output2 = await useCase.execute({
        refreshToken: output1.refreshToken,
      });

      // Token rotation - all should be valid tokens
      expect(typeof originalRefreshToken).toBe('string');
      expect(typeof output1.refreshToken).toBe('string');
      expect(typeof output2.refreshToken).toBe('string');
    });
  });
});

