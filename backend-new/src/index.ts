import dotenv from 'dotenv';
import { createApp } from './app';
import { DatabaseConnection } from '@infrastructure/database/DatabaseConnection';
import { EnvValidator } from '@infrastructure/config/EnvValidator';
import { logger } from '@infrastructure/config/Logger';

dotenv.config();

async function startServer(): Promise<void> {
    try {
        // Validate environment variables before starting
        EnvValidator.validate();
        logger.info('Environment variables validated successfully');

        const app = createApp();

        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            logger.info(`Server running on http://localhost:${PORT}`);
        });

        const shutdown = async (signal: string) => {
            logger.info(`${signal} received, shutting down gracefully...`);
            await DatabaseConnection.close();
            logger.info('Database connection closed');
            process.exit(0);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    } catch (error) {
        logger.error('Failed to start server', { error: error instanceof Error ? error.message : error });
        process.exit(1);
    }
}

startServer().catch((error) => {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : error });
    process.exit(1);
});

