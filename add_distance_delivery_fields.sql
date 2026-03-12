-- Executar este script no SQL Editor do seu painel do Supabase

ALTER TABLE store_settings 
ADD COLUMN IF NOT EXISTS store_cep text,
ADD COLUMN IF NOT EXISTS store_street text,
ADD COLUMN IF NOT EXISTS store_number text,
ADD COLUMN IF NOT EXISTS store_city text,
ADD COLUMN IF NOT EXISTS store_state text,
ADD COLUMN IF NOT EXISTS store_lat float8,
ADD COLUMN IF NOT EXISTS store_lng float8;
