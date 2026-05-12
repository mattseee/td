-- Индексы для оптимизации запросов
-- Выполнить после 04_orders_schema.sql

-- Товары: фильтрация по категории, бренду, поставщику
CREATE INDEX IF NOT EXISTS idx_products_category  ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand     ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier  ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_exclusive ON products(is_exclusive);

-- Цены: поиск по товару и филиалу
CREATE INDEX IF NOT EXISTS idx_prices_product ON prices(product_id);
CREATE INDEX IF NOT EXISTS idx_prices_branch  ON prices(branch_id);
CREATE INDEX IF NOT EXISTS idx_prices_dates   ON prices(valid_from, valid_to);

-- Остатки: поиск по товару и филиалу
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_branch  ON stock(branch_id);

-- Медиафайлы: быстрый поиск по товару
CREATE INDEX IF NOT EXISTS idx_productmedia_product ON productmedia(product_id);

-- Характеристики: поиск по товару
CREATE INDEX IF NOT EXISTS idx_specs_product ON productspecifications(product_id);

-- Связанные товары
CREATE INDEX IF NOT EXISTS idx_related_product ON relatedproducts(product_id);

-- Акции: активные акции по датам
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_productpromo     ON productpromotions(product_id);

-- Заказы: фильтрация по пользователю и статусу
CREATE INDEX IF NOT EXISTS idx_orders_user   ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Позиции заказа
CREATE INDEX IF NOT EXISTS idx_orderitems_order   ON orderitems(order_id);
CREATE INDEX IF NOT EXISTS idx_orderitems_product ON orderitems(product_id);

-- Адреса: быстрый поиск по пользователю
CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);
