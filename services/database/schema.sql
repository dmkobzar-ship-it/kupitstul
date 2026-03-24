-- ============================================
-- КупитьСтул — Order & Chat Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS kupitstul
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kupitstul;

-- -----------------------------------------------
-- 1. Orders table
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(255)   NOT NULL,
    phone         VARCHAR(50)    NOT NULL,
    email         VARCHAR(255)   NOT NULL DEFAULT '',
    product       VARCHAR(500)   NOT NULL DEFAULT '',
    message       TEXT,
    status        ENUM('new','processing','completed','cancelled') NOT NULL DEFAULT 'new',
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address    VARCHAR(45)    NOT NULL DEFAULT '',
    user_agent    VARCHAR(512)   NOT NULL DEFAULT '',
    utm_source    VARCHAR(255)   DEFAULT NULL,
    utm_medium    VARCHAR(255)   DEFAULT NULL,
    INDEX idx_status     (status),
    INDEX idx_created_at (created_at),
    INDEX idx_email      (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 2. CSRF tokens (anti-spam / anti-CSRF)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS csrf_tokens (
    token       VARCHAR(64)  PRIMARY KEY,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used        TINYINT(1)   NOT NULL DEFAULT 0,
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------
-- 3. Rate limiting
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS rate_limits (
    ip_address  VARCHAR(45)  NOT NULL,
    endpoint    VARCHAR(100) NOT NULL DEFAULT 'order',
    hit_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip_time (ip_address, hit_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -----------------------------------------------
-- 4. Chat sessions
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS chat_sessions (
    id              VARCHAR(36)  PRIMARY KEY,          -- UUID
    visitor_name    VARCHAR(255) DEFAULT '',
    visitor_email   VARCHAR(255) DEFAULT '',
    visitor_page    VARCHAR(1000) DEFAULT '',
    ip_address      VARCHAR(45)  DEFAULT '',
    user_agent      VARCHAR(512) DEFAULT '',
    max_chat_id     BIGINT       DEFAULT NULL,         -- MAX Bot chat ID for this session
    status          ENUM('active','closed') NOT NULL DEFAULT 'active',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status     (status),
    INDEX idx_max_chat   (max_chat_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- 5. Chat messages
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
    id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id  VARCHAR(36)    NOT NULL,
    sender      ENUM('visitor','operator') NOT NULL,
    body        TEXT           NOT NULL,
    created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session   (session_id, created_at),
    CONSTRAINT fk_chat_session FOREIGN KEY (session_id)
        REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- Cleanup event: purge old rate-limit rows daily
-- -----------------------------------------------
DELIMITER $$
CREATE EVENT IF NOT EXISTS cleanup_rate_limits
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    DELETE FROM rate_limits WHERE hit_at < NOW() - INTERVAL 1 HOUR;
    DELETE FROM csrf_tokens WHERE created_at < NOW() - INTERVAL 2 HOUR;
END$$
DELIMITER ;

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;
