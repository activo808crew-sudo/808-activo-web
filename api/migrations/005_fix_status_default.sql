ALTER TABLE events MODIFY COLUMN status ENUM('pending', 'published', 'rejected') DEFAULT NULL;
