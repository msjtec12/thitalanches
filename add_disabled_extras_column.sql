-- ============================================================
-- MIGRAÇÃO COMPLETA: Sistema de Adicionais/Extras
-- Execute este SQL no Supabase > SQL Editor
-- ============================================================

-- ═══════════════════════════════════════════════════════════
-- 1. TABELA: category_extra_groups (Grupos de complementos)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS category_extra_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  min_qty INTEGER NOT NULL DEFAULT 0,
  max_qty INTEGER NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE category_extra_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "category_extra_groups_select" ON category_extra_groups;
DROP POLICY IF EXISTS "category_extra_groups_insert" ON category_extra_groups;
DROP POLICY IF EXISTS "category_extra_groups_update" ON category_extra_groups;
DROP POLICY IF EXISTS "category_extra_groups_delete" ON category_extra_groups;

CREATE POLICY "category_extra_groups_select" ON category_extra_groups FOR SELECT USING (true);
CREATE POLICY "category_extra_groups_insert" ON category_extra_groups FOR INSERT WITH CHECK (true);
CREATE POLICY "category_extra_groups_update" ON category_extra_groups FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "category_extra_groups_delete" ON category_extra_groups FOR DELETE USING (true);


-- ═══════════════════════════════════════════════════════════
-- 2. TABELA: category_extra_items (Itens de cada grupo)
-- ═══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS category_extra_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES category_extra_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE category_extra_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "category_extra_items_select" ON category_extra_items;
DROP POLICY IF EXISTS "category_extra_items_insert" ON category_extra_items;
DROP POLICY IF EXISTS "category_extra_items_update" ON category_extra_items;
DROP POLICY IF EXISTS "category_extra_items_delete" ON category_extra_items;

CREATE POLICY "category_extra_items_select" ON category_extra_items FOR SELECT USING (true);
CREATE POLICY "category_extra_items_insert" ON category_extra_items FOR INSERT WITH CHECK (true);
CREATE POLICY "category_extra_items_update" ON category_extra_items FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "category_extra_items_delete" ON category_extra_items FOR DELETE USING (true);


-- ═══════════════════════════════════════════════════════════
-- 3. COLUNA: disabled_extra_ids na tabela products
-- ═══════════════════════════════════════════════════════════

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS disabled_extra_ids JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN products.disabled_extra_ids IS 'Array de IDs de extra items desabilitados para este produto específico';


-- ═══════════════════════════════════════════════════════════
-- 4. VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════

SELECT 'category_extra_groups' AS tabela, count(*) AS registros FROM category_extra_groups
UNION ALL
SELECT 'category_extra_items', count(*) FROM category_extra_items;
