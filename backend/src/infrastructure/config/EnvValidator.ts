interface RequiredEnvVars {
    database: string[];
    jwt: string[];
    oci: string[];
}

const REQUIRED_ENV_VARS: RequiredEnvVars = {
    database: ['DATABASE_URL'],
    jwt: ['JWT_SECRET'],
    oci: [
        'OCI_TENANCY_ID',
        'OCI_USER_ID',
        'OCI_FINGERPRINT',
        'OCI_PRIVATE_KEY',
        'OCI_NAMESPACE',
        'OCI_BUCKET_NAME',
        'OCI_COMPARTMENT_ID',
    ],
};

export class EnvValidator {
    static validate(): void {
        const missing: string[] = [];

        // Validate database
        for (const varName of REQUIRED_ENV_VARS.database) {
            if (!process.env[varName]) {
                missing.push(varName);
            }
        }

        // Validate JWT
        for (const varName of REQUIRED_ENV_VARS.jwt) {
            if (!process.env[varName]) {
                missing.push(varName);
            } else if (varName === 'JWT_SECRET' && process.env[varName].length < 32) {
                throw new Error(
                    `JWT_SECRET must be at least 32 characters long (currently ${process.env[varName].length})`
                );
            }
        }

        // Validate OCI
        for (const varName of REQUIRED_ENV_VARS.oci) {
            if (!process.env[varName]) {
                missing.push(varName);
            }
        }

        if (missing.length > 0) {
            throw new Error(
                `Missing required environment variables: ${missing.join(', ')}\n` +
                'Please check your .env file and ensure all required variables are set.'
            );
        }
    }
}

