-- Миграция: убрать все уникальные ограничения на sku.
-- В реальном каталоге один артикул может встречаться несколько раз
-- у одного бренда (разные модификации). Дедупликация — по brand+name в скрипте.
USE products_db;

SET @dbname = DATABASE();
SET @tbl = 'products';

-- Удалить uq_sku_supplier если существует
SET @sql1 = IF(
  (SELECT COUNT(1) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME=@tbl AND INDEX_NAME='uq_sku_supplier') > 0,
  'ALTER TABLE products DROP INDEX uq_sku_supplier',
  'SELECT 1'
);
PREPARE _s1 FROM @sql1; EXECUTE _s1; DEALLOCATE PREPARE _s1;

-- Удалить uniq_sku_brand если существует (может остаться от предыдущего запуска)
SET @sql2 = IF(
  (SELECT COUNT(1) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME=@tbl AND INDEX_NAME='uniq_sku_brand') > 0,
  'ALTER TABLE products DROP INDEX uniq_sku_brand',
  'SELECT 1'
);
PREPARE _s2 FROM @sql2; EXECUTE _s2; DEALLOCATE PREPARE _s2;

-- Удалить одиночный unique index sku если существует
SET @sql3 = IF(
  (SELECT COUNT(1) FROM information_schema.STATISTICS
   WHERE TABLE_SCHEMA=@dbname AND TABLE_NAME=@tbl AND INDEX_NAME='sku' AND NON_UNIQUE=0) > 0,
  'ALTER TABLE products DROP INDEX sku',
  'SELECT 1'
);
PREPARE _s3 FROM @sql3; EXECUTE _s3; DEALLOCATE PREPARE _s3;
