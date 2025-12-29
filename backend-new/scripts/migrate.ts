import dotenv from 'dotenv';
import { resolve } from 'path';
import { DatabaseConnection } from '../src/infrastructure/database/DatabaseConnection';
import { MigrationRunner } from '../src/infrastructure/database/MigrationRunner';

const isProduction = process.argv.includes('--prod') || process.env.NODE_ENV === 'production';
const envFile = isProduction ? '.env.production' : '.env';
const envPath = resolve(process.cwd(), envFile);

try {
    dotenv.config({ path: envPath });
    console.log(`Loaded environment from: ${envFile}`);
} catch (error) {
    dotenv.config({ path: resolve(process.cwd(), '.env') });
    if (isProduction) {
        console.warn(`Warning: .env.production not found, using .env instead`);
    }
}

async function main() {
    const command = process.argv[2] || 'run';
    const pool = DatabaseConnection.getPool();
    const migrationsPath = resolve(process.cwd(), 'migrations');
    const runner = new MigrationRunner(pool, migrationsPath);

    try {
        if (command === 'status') {
            await runner.getMigrationStatus();
        } else if (command === 'run') {
            await runner.runMigrations();
        } else {
            console.error(`Unknown command: ${command}`);
            console.log('Usage: npm run migrate:dev [run|status]');
            process.exit(1);
        }
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    } finally {
        await DatabaseConnection.close();
    }
}

main();

