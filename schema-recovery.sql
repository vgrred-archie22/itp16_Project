-- Run as a MariaDB/MySQL admin (e.g. `mariadb < schema.sql` or `mysql -u root -p < schema.sql`)
CREATE DATABASE IF NOT EXISTS todo_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'todo_user'@'localhost' IDENTIFIED BY 'change_me';
GRANT ALL PRIVILEGES ON todo_app.* TO 'todo_user'@'localhost';
FLUSH PRIVILEGES;

USE todo_app;

CREATE TABLE IF NOT EXISTS todos (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  done TINYINT(1) NOT NULL DEFAULT 0,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_done_priority (done, priority, id DESC)
);
