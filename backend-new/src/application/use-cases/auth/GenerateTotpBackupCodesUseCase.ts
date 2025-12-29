import { IUserRepository } from '@application/interfaces/IUserRepository';
import { UserId } from '@domain/value-objects/UserId';
import { randomBytes } from 'crypto';
import { createHash } from 'crypto';
import { logger } from '@infrastructure/config/Logger';
import { DatabaseConnection } from '@infrastructure/database/DatabaseConnection';

export interface GenerateTotpBackupCodesInput {
    userId: string;
}

export interface GenerateTotpBackupCodesOutput {
    backupCodes: string[];
    message: string;
}

export class GenerateTotpBackupCodesUseCase {
    constructor(private readonly userRepository: IUserRepository) { }

    async execute(input: GenerateTotpBackupCodesInput): Promise<GenerateTotpBackupCodesOutput> {
        const userId = UserId.fromString(input.userId);
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const backupCodes: string[] = [];
        const hashedCodes: string[] = [];

        for (let i = 0; i < 10; i++) {
            const code = randomBytes(4).toString('hex').toUpperCase();
            backupCodes.push(code);
            const hashedCode = createHash('sha256').update(code).digest('hex');
            hashedCodes.push(hashedCode);
        }


        const pool = DatabaseConnection.getPool();

        await pool.query('DELETE FROM totp_backup_codes WHERE user_id = $1', [userId.toString()]);

        for (const hashedCode of hashedCodes) {
            await pool.query(
                'INSERT INTO totp_backup_codes (id, user_id, code_hash, used, created_at) VALUES ($1, $2, $3, $4, $5)',
                [randomBytes(16).toString('hex'), userId.toString(), hashedCode, false, new Date()]
            );
        }

        logger.info('TOTP backup codes generated', {
            userId: userId.toString(),
        });

        return {
            backupCodes,
            message: 'Backup codes have been generated. Please save them securely. Each code can only be used once.',
        };
    }
}


