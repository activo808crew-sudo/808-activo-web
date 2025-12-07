ALTER TABLE events
ADD COLUMN start_date DATE NULL AFTER description,
ADD COLUMN start_time TIME NULL AFTER start_date,
ADD COLUMN recurrence VARCHAR(20) DEFAULT 'none' AFTER start_time;
