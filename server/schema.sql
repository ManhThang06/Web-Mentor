-- ============================================================
-- SQL SCHEMA FOR WEB_MENTOR DATABASE
-- ============================================================

CREATE DATABASE IF NOT EXISTS web_mentor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE web_mentor;

-- 1. Bảng Users (Xác thực đăng nhập & Quản lý Thành viên)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL DEFAULT 'Thành viên',
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng Mentors (Danh sách Mentor)
CREATE TABLE IF NOT EXISTS mentors (
    id VARCHAR(50) PRIMARY KEY,
    nickname VARCHAR(100) NOT NULL,
    major VARCHAR(100) NOT NULL,
    track VARCHAR(100) NOT NULL DEFAULT 'Lập trình ứng dụng',
    hobbies TEXT,
    max_slots INT NOT NULL DEFAULT 5,
    avatar LONGTEXT,
    facebook_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng Registrations (Chi tiết Đăng ký Mentee)
CREATE TABLE IF NOT EXISTS registrations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mentor_id VARCHAR(50) NOT NULL,
    mentee_name VARCHAR(100) NOT NULL,
    mentee_id VARCHAR(50) NOT NULL,
    registered_at VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (mentor_id) REFERENCES mentors(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SAMPLE SEED DATA
-- ============================================================

-- Chèn tài khoản Admin mặc định & Thành viên mẫu
INSERT INTO users (name, username, password, role)
VALUES 
('Nguyễn Mạnh Thắng', '52400036', 'Admin3237', 'admin'),
('Trần Thị Minh Anh', '52000123', '123456', 'user'),
('Lê Văn Nam', '52000456', 'password123', 'user')
ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password), role = VALUES(role);

-- Chèn Mentor mẫu
INSERT INTO mentors (id, nickname, major, track, hobbies, max_slots, facebook_url)
VALUES 
('m-1', 'Thắng Nguyễn', 'Khoa học Máy tính', 'Giải thuật & lập trình', 'Lập trình, Đọc sách, Đá bóng', 5, 'https://facebook.com'),
('m-2', 'Minh Anh', 'Kỹ thuật Phần mềm', 'Lập trình ứng dụng', 'Thiết kế UI/UX, Nghe nhạc', 3, 'https://facebook.com')
ON DUPLICATE KEY UPDATE nickname = VALUES(nickname), major = VALUES(major), track = VALUES(track);

-- Chèn Đăng ký mẫu
INSERT INTO registrations (mentor_id, mentee_name, mentee_id, registered_at)
VALUES 
('m-1', 'Nguyễn Văn A', '52000001', NOW()),
('m-1', 'Trần Thị B', '52000002', NOW())
ON DUPLICATE KEY UPDATE mentee_name = VALUES(mentee_name);
