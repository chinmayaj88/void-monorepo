-- Hybrid approach: Add email to file_permissions while keeping user_id
-- user_id: For data integrity (foreign key, CASCADE delete)
-- user_email: For user-friendly sharing and display

-- Step 1: Add email column (nullable initially for migration)
ALTER TABLE file_permissions 
ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);

-- Step 2: Migrate existing data: populate email from users table
UPDATE file_permissions fp
SET user_email = u.email
FROM users u
WHERE fp.user_id = u.id;

-- Step 3: Make email NOT NULL after migration
ALTER TABLE file_permissions 
ALTER COLUMN user_email SET NOT NULL;

-- Step 4: Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_file_permissions_user_email ON file_permissions(user_email);

-- Step 5: Add unique constraint on (file_id, user_email) for email-based lookups
-- Note: We keep the existing (file_id, user_id) constraint for data integrity
ALTER TABLE file_permissions 
ADD CONSTRAINT IF NOT EXISTS file_permissions_file_id_user_email_key UNIQUE(file_id, user_email);

-- Note: 
-- - user_id: Primary identifier (foreign key, ensures data integrity, CASCADE delete)
-- - user_email: User-friendly identifier (for sharing by email, display purposes)
-- - Both are stored and always in sync (email is permanent per account)
-- - Foreign key on user_id ensures automatic cleanup when user is deleted
-- - Email allows user-friendly sharing without needing to know userId
-- - Email cannot be changed (users must create new account for new email)
