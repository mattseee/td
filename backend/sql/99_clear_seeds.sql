-- Очистка тестовых данных перед импортом из каталога
-- Выполнять один раз в контексте products_db
USE products_db;

SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM productpromotions;
DELETE FROM productmedia;
DELETE FROM productspecifications;
DELETE FROM relatedproducts;
DELETE FROM documents;
DELETE FROM reviews;
DELETE FROM stock;
DELETE FROM prices;
DELETE FROM OrderItems;
DELETE FROM Orders;
DELETE FROM products;
DELETE FROM brands;
DELETE FROM categories;
DELETE FROM promotions;
-- Удалить все филиалы кроме Санкт-Петербурга (по полю city)
DELETE FROM branches WHERE city NOT LIKE '%Санкт-Петербург%';

SET FOREIGN_KEY_CHECKS = 1;

-- Сброс AUTO_INCREMENT для чистого старта
ALTER TABLE productpromotions    AUTO_INCREMENT = 1;
ALTER TABLE productmedia         AUTO_INCREMENT = 1;
ALTER TABLE productspecifications AUTO_INCREMENT = 1;
ALTER TABLE relatedproducts      AUTO_INCREMENT = 1;
ALTER TABLE documents            AUTO_INCREMENT = 1;
ALTER TABLE reviews              AUTO_INCREMENT = 1;
ALTER TABLE stock                AUTO_INCREMENT = 1;
ALTER TABLE prices               AUTO_INCREMENT = 1;
ALTER TABLE products             AUTO_INCREMENT = 1;
ALTER TABLE brands               AUTO_INCREMENT = 1;
ALTER TABLE categories           AUTO_INCREMENT = 1;
ALTER TABLE promotions           AUTO_INCREMENT = 1;
ALTER TABLE branches             AUTO_INCREMENT = 1;
