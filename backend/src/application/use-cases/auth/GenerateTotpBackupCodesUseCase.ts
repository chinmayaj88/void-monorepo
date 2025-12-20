import { UserId } from '@domain/value-objects/UserId';
import { IUserRepository } from '@application/interfaces/IUserRepository';
import { Pool } from 'pg';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseConnection } from '@infrastructure/database/DatabaseConnection';
import { logger } from '@infrastructure/config/Logger';

export interface GenerateTotpBackupCodesInput {
    userId: string;
    count?: number; // Default: 10
}

export interface GenerateTotpBackupCodesOutput {
    backupCodes: string[]; // Plain codes (show only once)
    message: string;
}

export class GenerateTotpBackupCodesUseCase {
    private readonly pool: Pool;

    constructor(private readonly userRepository: IUserRepository) {
        this.pool = DatabaseConnection.getPool();
    }

    async execute(input: GenerateTotpBackupCodesInput): Promise<GenerateTotpBackupCodesOutput> {
        const userId = UserId.fromString(input.userId);
        const count = input.count || 10;

        // Find user
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Delete existing unused backup codes
        await this.pool.query(
            'DELETE FROM totp_backup_codes WHERE user_id = $1 AND used_at IS NULL',
            [userId.toString()]
        );

        // Generate new backup codes
        const backupCodes: string[] = [];
        const codesToInsert: Array<{ id: string; userId: string; codeHash: string }> = [];

        for (let i = 0; i < count; i++) {
            // Generate 8-character code (alphanumeric, uppercase)
            const code = randomBytes(4).toString('hex').toUpperCase();
            backupCodes.push(code);

            // Hash the code for storage
            const codeHash = createHash('sha256').update(code).digest('hex');
            codesToInsert.push({
                id: uuidv4(),
                userId: userId.toString(),
                codeHash,
            });
        }

        // Insert backup codes into database
        for (const codeData of codesToInsert) {
            await this.pool.query(
                'INSERT INTO totp_backup_codes (id, user_id, code_hash, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
                [codeData.id, codeData.userId, codeData.codeHash]
            );
        }

        logger.info('TOTP backup codes generated', {
            userId: userId.toString(),
            count,
        });

        return {
            backupCodes,
            message: `Generated ${count} backup codes. Save these codes securely - they can only be viewed once.`,
        };
    }
}

