USE products_db;

CREATE TABLE IF NOT EXISTS users (
  user_id       INT(11) NOT NULL AUTO_INCREMENT,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name          VARCHAR(255),
  phone         VARCHAR(50),
  role          ENUM('user','admin') DEFAULT 'user',
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id),
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS addresses (
  address_id INT(11) NOT NULL AUTO_INCREMENT,
  user_id    INT(11) NOT NULL,
  city       VARCHAR(255),
  address    VARCHAR(500),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (address_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
