ALTER TABLE events ADD COLUMN status ENUM('pending', 'published', 'rejected') DEFAULT 'published';
ALTER TABLE events ADD INDEX idx_status (status);
