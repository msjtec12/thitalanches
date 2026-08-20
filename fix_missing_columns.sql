-- ==============================================================================
-- CORREÇÃO DE COLUNAS E PERMISSÕES (RLS) - THITA LANCHES
-- Execute este script no SQL Editor do Supabase para corrigir o erro da coluna 'badge'
-- e garantir que todos os campos e permissões do cardápio estejam 100% atualizados.
-- ==============================================================================

-- 1. ADICIONA COLUNAS QUE POSSAM ESTAR FALTANDO NA TABELA DE PRODUTOS (products)
ALTER TABLE products ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS disabled_extra_ids JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_combo BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS combo_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. ADICIONA COLUNAS NA TABELA DE CATEGORIAS (categories)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 3. ADICIONA COLUNAS NA TABELA DE CONFIGURAÇÕES (store_settings)
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS free_delivery_threshold NUMERIC(10,2) DEFAULT 60;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS is_sound_enabled BOOLEAN DEFAULT true;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS primary_color_hover TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_cep TEXT DEFAULT '14026596';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_street TEXT DEFAULT 'R. Magda Perona Frossard';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_number TEXT DEFAULT '565';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_city TEXT DEFAULT 'Ribeirão Preto';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_state TEXT DEFAULT 'SP';
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_lat FLOAT8 DEFAULT -21.2185116;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_lng FLOAT8 DEFAULT -47.8224098;

-- 4. GARANTIR POLÍTICAS DE RLS PERMISSIVAS PARA PRODUCTS E CATEGORIES
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_all" ON products;
DROP POLICY IF EXISTS "products_select_policy" ON products;
DROP POLICY IF EXISTS "products_insert_policy" ON products;
DROP POLICY IF EXISTS "products_update_policy" ON products;
DROP POLICY IF EXISTS "products_delete_policy" ON products;
DROP POLICY IF EXISTS "Allow all for anon" ON products;

CREATE POLICY "products_all" ON products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "categories_all" ON categories;
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON categories;
DROP POLICY IF EXISTS "categories_update_policy" ON categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON categories;

CREATE POLICY "categories_all" ON categories FOR ALL USING (true) WITH CHECK (true);

-- 5. RECARREGAR O CACHE DE SCHEMA DO POSTGREST NO SUPABASE
NOTIFY pgrst, 'reload schema';
