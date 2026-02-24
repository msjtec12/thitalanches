-- ============================================================
-- SCRIPT: Inserir 16 categorias do Thita Lanches no Supabase
-- Execute este SQL no Supabase > SQL Editor
-- ============================================================

-- 1. Remove categorias antigas (apenas as que não tiverem produtos vinculados)
--    Se quiser limpar tudo e recomeçar, descomente as linhas abaixo:
-- DELETE FROM products;
-- DELETE FROM categories;

-- 2. Insere as 16 categorias na ordem correta
--    ON CONFLICT DO NOTHING evita duplicar se já existirem pelo nome
INSERT INTO categories (name, sort_order) VALUES
  ('Combos',                    1),
  ('Hot Dog (Prensados)',        2),
  ('Lanches de Hambúrguer',     3),
  ('Lanches de Frango',         4),
  ('Lanches de Churrasco',      5),
  ('Lanches de Calabresa',      6),
  ('Lanches Universitários',    7),
  ('Especiais do Thita',        8),
  ('Thita Chicken',             9),
  ('Batata Frita',             10),
  ('Molhos Especiais',         11),
  ('Bebidas',                  12),
  ('Açaí',                     13),
  ('Sorvetes',                 14),
  ('Milk Shake',               15),
  ('Sobremesas',               16)
ON CONFLICT DO NOTHING;

-- 3. Verifica resultado
SELECT sort_order AS "#", name FROM categories ORDER BY sort_order;
