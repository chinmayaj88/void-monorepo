import dotenv from 'dotenv';
import { DatabaseConnection } from '../src/infrastructure/database/DatabaseConnection';
import { User } from '../src/domain/entities/User';
import { UserId } from '../src/domain/value-objects/UserId';
import { Email } from '../src/domain/value-objects/Email';
import { Role } from '../src/domain/value-objects/Role';
import { PasswordHasher } from '../src/infrastructure/encryption/PasswordHasher';
import { authenticator } from 'otplib';
import { randomUUID } from 'crypto';
import { logger } from '../src/infrastructure/config/Logger';

dotenv.config();

async function initAdmin(): Promise<void> {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      throw new Error('ADMIN_EMAIL environment variable is required');
    }

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is required. Set it temporarily to create the admin user.');
    }

    const pool = DatabaseConnection.getPool();

    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingAdmin.rows.length > 0) {
      logger.info('Admin user already exists', { email: adminEmail });
      return;
    }

    const userId = UserId.create(randomUUID());
    const email = Email.create(adminEmail);
    const passwordHash = await PasswordHasher.hash(adminPassword);
    const totpSecret = authenticator.generateSecret();
    const role = Role.admin();

    const user = User.create(userId, email, passwordHash, totpSecret, role);

    user.markEmailAsVerified();

    await pool.query(
      `INSERT INTO users (id, email, password_hash, totp_secret, role, created_at, updated_at, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user.getId().toString(),
        user.getEmail().toString(),
        user.getPasswordHash(),
        user.getTotpSecret(),
        user.getRole().toString(),
        user.getCreatedAt(),
        user.getUpdatedAt(),
        user.isEmailVerified(),
      ]
    );

    const serviceName = process.env.TOTP_ISSUER || 'Void Cloud Drive';
    const qrCodeUrl = authenticator.keyuri(
      email.toString(),
      serviceName,
      totpSecret
    );

    logger.info('Admin user created successfully', {
      userId: userId.toString(),
      email: email.toString(),
      qrCodeUrl,
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`📧 Email: ${email.toString()}`);
    console.log(`🔑 User ID: ${userId.toString()}`);
    console.log(`🔐 TOTP Secret: ${totpSecret}`);
    console.log(`📱 QR Code URL: ${qrCodeUrl}`);
    console.log('\n⚠️  IMPORTANT: Scan the QR code with your authenticator app and save the TOTP secret securely!');
    console.log('⚠️  Remove ADMIN_PASSWORD from your .env file after first login!\n');

    await DatabaseConnection.close();
  } catch (error) {
    logger.error('Failed to create admin user', { error: error instanceof Error ? error.message : error });
    console.error('❌ Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

initAdmin();

