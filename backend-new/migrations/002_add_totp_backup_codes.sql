-- Create TOTP backup codes table
CREATE TABLE IF NOT EXISTS totp_backup_codes (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_totp_backup_codes_user_id ON totp_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_totp_backup_codes_code_hash ON totp_backup_codes(code_hash);
CREATE INDEX IF NOT EXISTS idx_totp_backup_codes_used ON totp_backup_codes(used);


