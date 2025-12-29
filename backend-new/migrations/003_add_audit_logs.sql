-- Create audit_logs table for security event tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Comments for documentation
COMMENT ON TABLE audit_logs IS 'Audit log for all security and authentication events';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event (LOGIN_SUCCESS, PASSWORD_CHANGED, etc.)';
COMMENT ON COLUMN audit_logs.metadata IS 'Additional event-specific data in JSON format';


