-- Database Schema for Learning Hub
-- Run this file to create all necessary tables

-- Create database
CREATE DATABASE IF NOT EXISTS learning_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE learning_hub;

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Series table
CREATE TABLE IF NOT EXISTS series (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(100) DEFAULT 'ri-code-line',
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_code (code),
    INDEX idx_active_order (is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Files table
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    series_id INT NOT NULL,
    file_number INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
    UNIQUE KEY unique_series_file (series_id, file_number),
    INDEX idx_series_active (series_id, is_active, display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (username: admin, password: admin123)
-- IMPORTANT: Change this password immediately after first login!
INSERT INTO admin_users (username, password_hash, email) VALUES
('admin', 'admin123', 'admin@learninghub.com');

-- Insert default series
INSERT INTO series (code, name, icon, display_order, is_active) VALUES
('BS', 'Bootstrap', 'ri-layout-grid-fill', 1, TRUE),
('JS', 'JavaScript', 'ri-javascript-fill', 2, TRUE),
('CS', 'CSS', 'ri-css3-fill', 3, TRUE),
('HM', 'HTML', 'ri-html5-fill', 4, TRUE),
('PHP', 'PHP', 'ri-code-s-slash-fill', 5, TRUE);

-- Sample file entries (you'll populate these via migration script or admin panel)
INSERT INTO files (series_id, file_number, title, content, display_order) VALUES
(1, 0, 'Introduction', '# Welcome to Bootstrap Series\n\n## Getting Started\n\nThis is a sample introduction file.', 0);
