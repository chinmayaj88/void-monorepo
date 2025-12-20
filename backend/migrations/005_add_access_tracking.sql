-- Add access tracking columns for smart archiving
-- This enables automatic archiving of files not accessed in X days

ALTER TABLE files 
ADD COLUMN IF NOT EXISTS last_accessed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS access_count INTEGER DEFAULT 0;

-- Index for efficient queries on files to archive
CREATE INDEX IF NOT EXISTS idx_files_last_accessed_at ON files(last_accessed_at);
CREATE INDEX IF NOT EXISTS idx_files_storage_tier ON files(storage_tier);

-- Update existing files to have access_count = 0 and last_accessed_at = created_at
UPDATE files 
SET last_accessed_at = created_at 
WHERE last_accessed_at IS NULL;

-- Comments for documentation
COMMENT ON COLUMN files.last_accessed_at IS 'Last time file was accessed (downloaded/viewed). Used for auto-archiving.';
COMMENT ON COLUMN files.access_count IS 'Number of times file has been accessed. Used for analytics and archiving decisions.';

