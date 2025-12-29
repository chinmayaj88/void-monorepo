-- Add folder support to files table
ALTER TABLE files 
ADD COLUMN IF NOT EXISTS parent_folder_id VARCHAR(255) REFERENCES files(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_folder BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS access_type VARCHAR(20) NOT NULL DEFAULT 'private',
ADD COLUMN IF NOT EXISTS share_token VARCHAR(255) UNIQUE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_files_parent_folder_id ON files(parent_folder_id);
CREATE INDEX IF NOT EXISTS idx_files_is_folder ON files(is_folder);
CREATE INDEX IF NOT EXISTS idx_files_access_type ON files(access_type);
CREATE INDEX IF NOT EXISTS idx_files_share_token ON files(share_token);

-- Permissions table for sharing with specific users
CREATE TABLE IF NOT EXISTS file_permissions (
    id VARCHAR(255) PRIMARY KEY,
    file_id VARCHAR(255) NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_type VARCHAR(20) NOT NULL CHECK (permission_type IN ('read', 'write', 'delete')),
    granted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(file_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_file_permissions_file_id ON file_permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_permissions_user_id ON file_permissions(user_id);

-- Note: Folders have empty oci_object_key, files have non-empty oci_object_key
-- This is enforced at application level, not database level for flexibility

