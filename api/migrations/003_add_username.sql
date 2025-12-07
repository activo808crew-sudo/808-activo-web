-- Add username column to staff_users table
ALTER TABLE staff_users
ADD COLUMN username VARCHAR(50) UNIQUE AFTER email;
