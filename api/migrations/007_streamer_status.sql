-- Migration: Add is_live column to streamers table for notification tracking
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT FALSE;
ALTER TABLE streamers ADD COLUMN IF NOT EXISTS last_live_at TIMESTAMP NULL DEFAULT NULL;
