-- =============================================
-- Migração: Sistema de Adicionais estilo iFood
-- =============================================
-- Grupos de complementos por categoria com
-- regras de mínimo/máximo e obrigatoriedade.
-- =============================================

-- 1. Tabela de GRUPOS de complementos
CREATE TABLE IF NOT EXISTS category_extra_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  min_qty INT NOT NULL DEFAULT 0,
  max_qty INT NOT NULL DEFAULT 0,
  is_required BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de ITENS dentro de cada grupo
CREATE TABLE IF NOT EXISTS category_extra_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES category_extra_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Índices
CREATE INDEX IF NOT EXISTS idx_extra_groups_category_id
  ON category_extra_groups(category_id);

CREATE INDEX IF NOT EXISTS idx_extra_items_group_id
  ON category_extra_items(group_id);

-- 4. RLS
ALTER TABLE category_extra_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_extra_items ENABLE ROW LEVEL SECURITY;

-- 5. Políticas de leitura pública
CREATE POLICY "Allow public read on category_extra_groups"
  ON category_extra_groups FOR SELECT USING (true);

CREATE POLICY "Allow public read on category_extra_items"
  ON category_extra_items FOR SELECT USING (true);

-- 6. Políticas de escrita
CREATE POLICY "Allow write on category_extra_groups"
  ON category_extra_groups FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow write on category_extra_items"
  ON category_extra_items FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- NOTA: As tabelas anteriores (category_extras,
-- product_extras) podem ser removidas futuramente.
-- DROP TABLE IF EXISTS category_extras;
-- DROP TABLE IF EXISTS product_extras;
-- =============================================
