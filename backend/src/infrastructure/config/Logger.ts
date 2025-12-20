type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
    private isDevelopment = process.env.NODE_ENV === 'development';
    private isTest = process.env.NODE_ENV === 'test';

    private log(level: LogLevel, message: string, ...args: unknown[]): void {
        if (this.isTest) return; // Skip logging in tests

        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        if (level === 'error') {
            console.error(prefix, message, ...args);
        } else if (level === 'warn') {
            console.warn(prefix, message, ...args);
        } else {
            console.log(prefix, message, ...args);
        }
    }

    error(message: string, ...args: unknown[]): void {
        this.log('error', message, ...args);
    }

    warn(message: string, ...args: unknown[]): void {
        this.log('warn', message, ...args);
    }

    info(message: string, ...args: unknown[]): void {
        this.log('info', message, ...args);
    }

    debug(message: string, ...args: unknown[]): void {
        if (this.isDevelopment) {
            this.log('debug', message, ...args);
        }
    }
}

export const logger = new Logger();

