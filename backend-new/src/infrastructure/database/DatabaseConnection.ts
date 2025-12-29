import { Pool, PoolConfig } from 'pg';
import { DatabaseConfigService } from '@infrastructure/config/DatabaseConfig';
import { logger } from '@infrastructure/config/Logger';

export class DatabaseConnection {
    private static pool: Pool | null = null;

    static getPool(): Pool {
        if (!this.pool) {
            const config = DatabaseConfigService.getConfig();
            const poolConfig: PoolConfig = {
                connectionString: config.connectionString,
                max: config.maxConnections,
                connectionTimeoutMillis: config.connectionTimeout,
                idleTimeoutMillis: 30000,
                allowExitOnIdle: false,
            };

            this.pool = new Pool(poolConfig);

            this.pool.on('error', (err) => {
                logger.error('Unexpected error on idle client', { error: err.message, stack: err.stack });
            });
        }

        return this.pool;
    }

    static async close(): Promise<void> {
        if (this.pool) {
            await this.pool.end();
            this.pool = null;
        }
    }
}

