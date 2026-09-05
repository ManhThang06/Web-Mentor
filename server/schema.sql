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
    mssv VARCHAR(50),
    major VARCHAR(100) NOT NULL,
    track VARCHAR(100) NOT NULL DEFAULT 'Lập trình ứng dụng',
    hobbies TEXT,
    max_slots INT NOT NULL DEFAULT 10,
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

