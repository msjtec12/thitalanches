-- Adiciona coluna para controlar extras desabilitados por produto
-- Cada produto pode ter uma lista de IDs de extras que NÃO se aplicam a ele
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS disabled_extra_ids JSONB DEFAULT '[]'::jsonb;

-- Comentário para documentação
COMMENT ON COLUMN products.disabled_extra_ids IS 'Array de IDs de extra items desabilitados para este produto específico';
