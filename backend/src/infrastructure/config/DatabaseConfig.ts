export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    maxConnections?: number;
    connectionTimeout?: number;
}

export class DatabaseConfigService {
    static getConfig(): DatabaseConfig {
        return {
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '5432', 10),
            database: process.env.DB_NAME || 'void_clouddrive',
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'postgres',
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
            connectionTimeout: parseInt(
                process.env.DB_CONNECTION_TIMEOUT || '5000',
                10
            ),
        };
    }
}