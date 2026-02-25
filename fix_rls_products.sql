-- ============================================================
-- FIX: Row Level Security para tabelas do cardápio
-- Execute este SQL no Supabase > SQL Editor
-- Problema: "new row violates row level security policy for table 'products'"
-- ============================================================

-- ----- TABELA: products -----

-- Remove políticas antigas conflitantes (se existirem)
DROP POLICY IF EXISTS "Allow all for anon" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert for all users" ON products;
DROP POLICY IF EXISTS "Enable update for all users" ON products;
DROP POLICY IF EXISTS "Enable delete for all users" ON products;
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;

-- Garante que RLS está ativado
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Cria políticas permissivas para anon (sistema usa PIN, sem auth.uid())
CREATE POLICY "products_select_policy" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_insert_policy" ON products
  FOR INSERT WITH CHECK (true);

CREATE POLICY "products_update_policy" ON products
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "products_delete_policy" ON products
  FOR DELETE USING (true);


-- ----- TABELA: product_extras -----

DROP POLICY IF EXISTS "Allow all for anon" ON product_extras;
DROP POLICY IF EXISTS "Enable read access for all users" ON product_extras;
DROP POLICY IF EXISTS "Enable insert for all users" ON product_extras;
DROP POLICY IF EXISTS "Enable update for all users" ON product_extras;
DROP POLICY IF EXISTS "Enable delete for all users" ON product_extras;
DROP POLICY IF EXISTS "product_extras_select_policy" ON product_extras;
DROP POLICY IF EXISTS "product_extras_insert_policy" ON product_extras;
DROP POLICY IF EXISTS "product_extras_update_policy" ON product_extras;
DROP POLICY IF EXISTS "product_extras_delete_policy" ON product_extras;

ALTER TABLE product_extras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_extras_select_policy" ON product_extras
  FOR SELECT USING (true);

CREATE POLICY "product_extras_insert_policy" ON product_extras
  FOR INSERT WITH CHECK (true);

CREATE POLICY "product_extras_update_policy" ON product_extras
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "product_extras_delete_policy" ON product_extras
  FOR DELETE USING (true);


-- ----- TABELA: categories (por precaução) -----

DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "categories_select_policy" ON categories
  FOR SELECT USING (true);

CREATE POLICY "categories_insert_policy" ON categories
  FOR INSERT WITH CHECK (true);

CREATE POLICY "categories_update_policy" ON categories
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "categories_delete_policy" ON categories
  FOR DELETE USING (true);


-- Verifica as políticas criadas
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('products', 'product_extras', 'categories')
ORDER BY tablename, cmd;
