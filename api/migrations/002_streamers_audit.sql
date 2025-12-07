-- Streamers and Audit Logs Schema
-- Migration 002

-- Table: streamers
CREATE TABLE IF NOT EXISTS streamers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    platform ENUM('twitch', 'youtube') DEFAULT 'twitch',
    channel_id VARCHAR(255) NOT NULL, -- Username for Twitch, Channel ID for YT
    description TEXT,
    image_url TEXT,
    custom_title VARCHAR(255),
    is_live BOOLEAN DEFAULT FALSE,
    last_live_at DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES staff_users(id) ON DELETE SET NULL,
    INDEX idx_platform (platform),
    INDEX idx_channel (channel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL, -- e.g. 'CREATE_EVENT', 'DELETE_STREAMER'
    details JSON, -- Store relevant data (e.g. event ID, name)
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES staff_users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
