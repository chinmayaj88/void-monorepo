import { Pool } from 'pg';
import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '@infrastructure/config/Logger';

interface MigrationFile {
    name: string;
    number: number;
    path: string;
}

export class MigrationRunner {
    private pool: Pool;
    private migrationsPath: string;

    constructor(pool: Pool, migrationsPath: string = './migrations') {
        this.pool = pool;
        this.migrationsPath = migrationsPath;
    }

    async runMigrations(): Promise<void> {
        logger.info('Starting database migrations...');

        // Create migrations tracking table if it doesn't exist
        await this.createMigrationsTable();

        // Get all migration files
        const migrationFiles = await this.getMigrationFiles();

        // Get already executed migrations
        const executedMigrations = await this.getExecutedMigrations();

        // Filter out already executed migrations
        const pendingMigrations = migrationFiles.filter(
            (migration) => !executedMigrations.includes(migration.number)
        );

        if (pendingMigrations.length === 0) {
            logger.info('No pending migrations. Database is up to date.');
            return;
        }

        logger.info(`Found ${pendingMigrations.length} pending migration(s)`);

        // Execute pending migrations in order
        for (const migration of pendingMigrations) {
            await this.executeMigration(migration);
        }

        logger.info('All migrations completed successfully!');
    }

    private async createMigrationsTable(): Promise<void> {
        await this.pool.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INTEGER PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    private async getMigrationFiles(): Promise<MigrationFile[]> {
        try {
            const files = await readdir(this.migrationsPath);
            const migrationFiles: MigrationFile[] = [];

            for (const file of files) {
                if (file.endsWith('.sql')) {
                    const match = file.match(/^(\d+)_(.+)\.sql$/);
                    if (match) {
                        migrationFiles.push({
                            name: file,
                            number: parseInt(match[1], 10),
                            path: join(this.migrationsPath, file),
                        });
                    }
                }
            }

            // Sort by migration number
            return migrationFiles.sort((a, b) => a.number - b.number);
        } catch (error) {
            logger.error('Error reading migration files', { error: error instanceof Error ? error.message : error, path: this.migrationsPath });
            throw new Error(`Failed to read migration files from ${this.migrationsPath}`);
        }
    }

    private async getExecutedMigrations(): Promise<number[]> {
        const result = await this.pool.query<{ version: number }>(
            'SELECT version FROM schema_migrations ORDER BY version'
        );
        return result.rows.map((row) => row.version);
    }

    private async executeMigration(migration: MigrationFile): Promise<void> {
        const client = await this.pool.connect();
        try {
            logger.info(`Executing migration: ${migration.name}...`);

            await client.query('BEGIN');

            // Read and execute SQL file
            const sql = await readFile(migration.path, 'utf-8');
            await client.query(sql);

            // Record migration as executed
            await client.query(
                'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
                [migration.number, migration.name]
            );

            await client.query('COMMIT');
            logger.info(`Migration ${migration.name} executed successfully`);
        } catch (error) {
            await client.query('ROLLBACK');
            logger.error(`Migration ${migration.name} failed`, { error: error instanceof Error ? error.message : error });
            throw new Error(`Migration ${migration.name} failed: ${error}`);
        } finally {
            client.release();
        }
    }

    async getMigrationStatus(): Promise<void> {
        const migrationFiles = await this.getMigrationFiles();
        const executedMigrations = await this.getExecutedMigrations();

        console.log('\nMigration Status:');
        console.log('==================');

        for (const migration of migrationFiles) {
            const isExecuted = executedMigrations.includes(migration.number);
            const status = isExecuted ? '✓ Executed' : '○ Pending';
            console.log(`${status} - ${migration.name}`);
        }

        const pendingCount = migrationFiles.length - executedMigrations.length;
        console.log(`\nTotal: ${migrationFiles.length} migrations, ${executedMigrations.length} executed, ${pendingCount} pending`);
    }
}

