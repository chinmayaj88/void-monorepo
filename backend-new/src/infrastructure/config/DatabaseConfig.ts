export interface DatabaseConfig {
    connectionString: string;
    maxConnections?: number;
    connectionTimeout?: number;
}

export class DatabaseConfigService {
    static getConfig(): DatabaseConfig {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error(
                'DATABASE_URL environment variable is required. ' +
                'Format: postgresql://username:password@host:port/database'
            );
        }

        return {
            connectionString: databaseUrl,
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
            connectionTimeout: parseInt(
                process.env.DB_CONNECTION_TIMEOUT || '5000',
                10
            ),
        };
    }
}

