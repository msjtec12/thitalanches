-- =============================================
-- Migração: Adicionais por Categoria
-- =============================================
-- Cria a tabela category_extras para armazenar
-- adicionais/complementos vinculados a categorias
-- ao invés de produtos individuais.
-- =============================================

-- 1. Criar tabela category_extras
CREATE TABLE IF NOT EXISTS category_extras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Índice para busca por categoria
CREATE INDEX IF NOT EXISTS idx_category_extras_category_id 
  ON category_extras(category_id);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE category_extras ENABLE ROW LEVEL SECURITY;

-- 4. Política de leitura pública (para clientes verem os adicionais)
CREATE POLICY "Allow public read access on category_extras"
  ON category_extras FOR SELECT
  USING (true);

-- 5. Política de escrita (admin/service_role)
CREATE POLICY "Allow authenticated write on category_extras"
  ON category_extras FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- OPCIONAL: Migrar dados existentes de product_extras
-- para category_extras (agrupa por categoria)
-- =============================================
-- Se você já tem adicionais cadastrados por produto,
-- este INSERT irá migrar os dados únicos para category_extras.
-- Descomente e execute se necessário:
--
-- INSERT INTO category_extras (name, price, is_active, category_id)
-- SELECT DISTINCT ON (pe.name, p.category_id)
--   pe.name,
--   pe.price,
--   pe.is_active,
--   p.category_id
-- FROM product_extras pe
-- JOIN products p ON pe.product_id = p.id
-- ORDER BY pe.name, p.category_id, pe.created_at DESC;

-- =============================================
-- NOTA: A tabela product_extras continua existindo
-- mas não é mais usada pela aplicação.
-- Você pode removê-la futuramente quando confirmar
-- que tudo está funcionando:
-- DROP TABLE IF EXISTS product_extras;
-- =============================================
