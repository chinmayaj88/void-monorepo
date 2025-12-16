import dotenv from 'dotenv';
import path from 'path';
import { createApp } from './app';
import { DatabaseConnection } from '@infrastructure/database/DatabaseConnection';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
// dotenv.config()

async function startServer(): Promise<void> {
    const app = createApp();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    const shutdown = async (signal: string) => {
        console.log(`${signal} received, shutting down gracefully...`);
        await DatabaseConnection.close();
        process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});