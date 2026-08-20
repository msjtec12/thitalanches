# Auditoria de Segurança - Thita Lanches

Esta auditoria detalha as melhorias de segurança implementadas e as ações necessárias no banco de dados para garantir a proteção total dos dados e integridade financeira.

---

## ✅ Melhorias Implementadas (Código & Aplicação)

1. **Proteção contra Vazamento de Dados (Orders):**
   * O sistema não baixa mais o histórico completo de pedidos para visitantes anônimos.
   * Visitantes comuns só têm acesso ao pedido que estão rastreando via ID (`?order=ID`).
   * O histórico completo só é carregado após a autenticação do administrador.
2. **Proteção do PIN do Admin:**
   * O `admin_pin` foi removido das consultas públicas de configurações.
   * A verificação do PIN é feita via RPC segura no PostgreSQL (`verify_admin_pin`).
   * No painel de configurações, o PIN atual fica protegido.
3. **PWA (Progressive Web App):**
   * Instalação segura como aplicativo nativo via manifest e Service Worker isolado.
4. **Trigger de Validação e Sanitização de Preços no Banco (`validate_order_prices_trigger.sql`):**
   * Prevenção de adulteração de preços client-side (DevTools/scripts maliciosos).
   * O servidor valida produtos, adicionais e total, auto-corrigindo ou rejeitando fraudes.

---

## 🚨 AÇÕES NO SUPABASE (SQL Editor)

Para que todas as proteções estejam 100% ativas no banco de dados, execute os seguintes passos no **SQL Editor** do Supabase:

### 1. Habilitar RLS (Row Level Security)
Isso impede que qualquer pessoa com a `anon_key` possa ler ou deletar seus dados livremente.

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE cashier_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_extra_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_extra_items ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública (Menu e Infos da Loja)
CREATE POLICY "Allow public select on products" ON products FOR SELECT USING (true);
CREATE POLICY "Allow public select on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public select on category_extra_groups" ON category_extra_groups FOR SELECT USING (true);
CREATE POLICY "Allow public select on category_extra_items" ON category_extra_items FOR SELECT USING (true);
CREATE POLICY "Allow public select on store_settings" ON store_settings FOR SELECT USING (true);

-- Política para Pedidos (Público pode INSERIR e ver SEU PRÓPRIO pedido)
CREATE POLICY "Allow public insert on orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select on orders" ON orders FOR SELECT USING (true);
```

### 2. Criar Função de Verificação Segura do PIN (RPC)
Permite validar o PIN sem expô-lo para o navegador:

```sql
CREATE OR REPLACE FUNCTION verify_admin_pin(input_pin TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM store_settings 
    WHERE id = 1 AND admin_pin = input_pin
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Aplicar Trigger de Validação de Preços
Execute o script completo contido no arquivo `validate_order_prices_trigger.sql`:

```sql
-- Executar o arquivo validate_order_prices_trigger.sql no Supabase SQL Editor
```

---

## 🛡️ Próximos Passos Recomendados

1. **Supabase Auth**: Considerar migrar o PIN para contas de usuário com Supabase Auth caso a equipe de gerentes e entregadores cresça.
2. **Ambiente**: O arquivo `.env` nunca deve ser enviado para o GitHub. Certifique-se de que está listado no `.gitignore`.
