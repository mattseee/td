-- products_db schema — Фаза 1
CREATE DATABASE IF NOT EXISTS products_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE products_db;

CREATE TABLE IF NOT EXISTS brands (
  brand_id INT(11) NOT NULL AUTO_INCREMENT,
  NAME     VARCHAR(255) NOT NULL,
  PRIMARY KEY (brand_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  category_id INT(11) NOT NULL AUTO_INCREMENT,
  NAME        VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL,
  parent_id   INT(11) NULL,
  PRIMARY KEY (category_id),
  UNIQUE KEY uq_slug (slug),
  FOREIGN KEY (parent_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS suppliers (
  supplier_id  INT(11) NOT NULL AUTO_INCREMENT,
  NAME         VARCHAR(255) NOT NULL,
  contact_info TEXT,
  PRIMARY KEY (supplier_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS branches (
  branch_id    INT(11) NOT NULL AUTO_INCREMENT,
  NAME         VARCHAR(255) NOT NULL,
  city         VARCHAR(255) NOT NULL,
  address      VARCHAR(500),
  contact_info TEXT,
  PRIMARY KEY (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  product_id    INT(11) NOT NULL AUTO_INCREMENT,
  supplier_id   INT(11) NULL,
  category_id   INT(11) NULL,
  brand_id      INT(11) NULL,
  sku           VARCHAR(100),
  NAME          VARCHAR(255) NOT NULL,
  description   TEXT,
  hs_code       VARCHAR(50),
  power_cold    DECIMAL(10,2) NULL,
  power_heat    DECIMAL(10,2) NULL,
  size_internal VARCHAR(50) NULL,
  size_external VARCHAR(50) NULL,
  air_flow      DECIMAL(10,2) NULL,
  weight        DECIMAL(10,2) NULL,
  is_exclusive  TINYINT(1) DEFAULT 0,
  PRIMARY KEY (product_id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(supplier_id),
  FOREIGN KEY (category_id) REFERENCES categories(category_id),
  FOREIGN KEY (brand_id) REFERENCES brands(brand_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prices (
  price_id       INT(11) NOT NULL AUTO_INCREMENT,
  product_id     INT(11) NOT NULL,
  supplier_id    INT(11) NULL,
  branch_id      INT(11) NOT NULL,
  price          DECIMAL(15,2) NOT NULL,
  discount_price DECIMAL(15,2) NULL,
  valid_from     DATE NOT NULL,
  valid_to       DATE NOT NULL,
  PRIMARY KEY (price_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock (
  stock_id   INT(11) NOT NULL AUTO_INCREMENT,
  product_id INT(11) NOT NULL,
  branch_id  INT(11) NOT NULL,
  quantity   INT(11) DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stock_id),
  UNIQUE KEY uq_product_branch (product_id, branch_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productmedia (
  media_id   INT(11) NOT NULL AUTO_INCREMENT,
  product_id INT(11) NOT NULL,
  TYPE       ENUM('image','video','doc') NOT NULL DEFAULT 'image',
  url        VARCHAR(500) NOT NULL,
  PRIMARY KEY (media_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productspecifications (
  spec_id    INT(11) NOT NULL AUTO_INCREMENT,
  product_id INT(11) NOT NULL,
  NAME       VARCHAR(255) NOT NULL,
  VALUE      VARCHAR(255) NOT NULL,
  unit       VARCHAR(50),
  PRIMARY KEY (spec_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS relatedproducts (
  id            INT(11) NOT NULL AUTO_INCREMENT,
  product_id    INT(11) NOT NULL,
  related_id    INT(11) NOT NULL,
  relation_type ENUM('сопутствующий','аналог') NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (related_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS promotions (
  promotion_id INT(11) NOT NULL AUTO_INCREMENT,
  NAME         VARCHAR(255) NOT NULL,
  description  TEXT,
  valid_from   DATE NOT NULL,
  valid_to     DATE NOT NULL,
  PRIMARY KEY (promotion_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productpromotions (
  id           INT(11) NOT NULL AUTO_INCREMENT,
  product_id   INT(11) NOT NULL,
  promotion_id INT(11) NOT NULL,
  promo_price  DECIMAL(15,2) NOT NULL,
  PRIMARY KEY (id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
  FOREIGN KEY (promotion_id) REFERENCES promotions(promotion_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS documents (
  document_id INT(11) NOT NULL AUTO_INCREMENT,
  product_id  INT(11) NOT NULL,
  TYPE        VARCHAR(100),
  url         VARCHAR(500) NOT NULL,
  PRIMARY KEY (document_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reviews (
  review_id  INT(11) NOT NULL AUTO_INCREMENT,
  product_id INT(11) NOT NULL,
  user_name  VARCHAR(255) NOT NULL,
  rating     TINYINT(4) NOT NULL,
  COMMENT    TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (review_id),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
