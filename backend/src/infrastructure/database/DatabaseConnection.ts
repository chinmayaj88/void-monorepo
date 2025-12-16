import { Pool, PoolConfig } from 'pg';
import { DatabaseConfigService } from '@infrastructure/config/DatabaseConfig';

export class DatabaseConnection {
    private static pool: Pool | null = null;

    static getPool(): Pool {
        if (!this.pool) {
            const config = DatabaseConfigService.getConfig();
            const poolConfig: PoolConfig = {
                host: config.host,
                port: config.port,
                database: config.database,
                user: config.user,
                password: config.password,
                max: config.maxConnections,
                connectionTimeoutMillis: config.connectionTimeout,
                idleTimeoutMillis: 30000,
                allowExitOnIdle: false,
            };

            this.pool = new Pool(poolConfig);

            this.pool.on('error', (err) => {
                console.error('Unexpected error on idle client', err);
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