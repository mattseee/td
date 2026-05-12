-- Фаза 3: таблицы заказов
-- Выполнять в контексте products_db

CREATE TABLE IF NOT EXISTS Orders (
  order_id    INT          NOT NULL AUTO_INCREMENT,
  user_id     INT          NOT NULL,
  status      ENUM('pending','processing','completed','cancelled') NOT NULL DEFAULT 'pending',
  total       DECIMAL(15,2) NOT NULL DEFAULT 0,
  address_id  INT          NULL,
  city        VARCHAR(255) NULL,
  address     VARCHAR(500) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id),
  CONSTRAINT fk_orders_user    FOREIGN KEY (user_id)    REFERENCES users(user_id)     ON DELETE CASCADE,
  CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES addresses(address_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS OrderItems (
  order_item_id INT           NOT NULL AUTO_INCREMENT,
  order_id      INT           NOT NULL,
  product_id    INT           NOT NULL,
  quantity      INT           NOT NULL DEFAULT 1,
  price         DECIMAL(15,2) NOT NULL,
  PRIMARY KEY (order_item_id),
  CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders(order_id)     ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_orders_user       ON Orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orderitems_order  ON OrderItems(order_id);
CREATE INDEX IF NOT EXISTS idx_orderitems_product ON OrderItems(product_id);
