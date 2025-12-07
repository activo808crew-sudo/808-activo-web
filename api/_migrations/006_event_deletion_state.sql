ALTER TABLE events MODIFY COLUMN status ENUM('pending', 'published', 'rejected', 'pending_deletion') DEFAULT NULL;
