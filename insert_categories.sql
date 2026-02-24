-- ============================================================
-- SCRIPT: Inserir 12 categorias do Thita Lanches no Supabase
-- Execute este SQL no Supabase > SQL Editor
-- As categorias existentes (Lanches, Porções, etc.) podem ser 
-- removidas antes se desejar começar do zero.
-- ============================================================

-- Opcional: limpar categorias antigas (CUIDADO se tiver produtos vinculados)
-- DELETE FROM categories;

-- Inserir as 12 categorias na ordem correta
INSERT INTO categories (name, sort_order) VALUES
  ('Hot Dog (Prensados)',            1),
  ('Lanches de Hambúrguer',          2),
  ('Lanches de Frango',              3),
  ('Lanches de Churrasco',           4),
  ('Lanches Universitário',          5),
  ('Lanches de Chicken',             6),
  ('Lanches Especiais do Thita',     7),
  ('Açaí',                          8),
  ('Milk Shake',                     9),
  ('Sorvetes',                      10),
  ('Bebidas',                       11),
  ('Sobremesas',                    12)
ON CONFLICT DO NOTHING;

-- Verificar resultado
SELECT id, name, sort_order FROM categories ORDER BY sort_order;
