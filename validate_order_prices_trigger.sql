-- ==============================================================================
-- TRIGGER DE VALIDAÇÃO E PROTEÇÃO DE PREÇOS NO BANCO DE DADOS (SUPABASE / POSTGRESQL)
-- Thita Lanches - Proteção contra fraude e adulteração client-side de pedidos
-- ==============================================================================

-- 1. Criação ou substituição da função PL/pgSQL de validação de pedidos
CREATE OR REPLACE FUNCTION validate_order_prices_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  item RECORD;
  extra RECORD;
  v_prod_id TEXT;
  v_db_prod_price NUMERIC(10,2);
  v_item_qty INTEGER;
  v_extras_sum NUMERIC(10,2);
  v_db_extra_price NUMERIC(10,2);
  v_calculated_subtotal NUMERIC(10,2) := 0;
  v_delivery_fee NUMERIC(10,2) := 0;
  v_min_acceptable_total NUMERIC(10,2);
  v_sanitized_items JSONB := '[]'::jsonb;
  v_item_json JSONB;
  v_product_json JSONB;
BEGIN
  -- Se o pedido não contém itens, rejeita a inserção
  IF NEW.items IS NULL OR jsonb_array_length(NEW.items) = 0 THEN
    RAISE EXCEPTION 'O pedido deve conter pelo menos um item válido.';
  END IF;

  -- 1. Itera por cada item do carrinho enviado no JSONB
  FOR v_item_json IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    v_prod_id := v_item_json->'product'->>'id';
    v_item_qty := COALESCE((v_item_json->>'quantity')::INTEGER, 1);
    
    IF v_item_qty <= 0 THEN
      v_item_qty := 1;
    END IF;

    -- Busca o preço real e oficial do produto cadastrado no banco de dados
    v_db_prod_price := NULL;
    IF v_prod_id IS NOT NULL THEN
      SELECT price INTO v_db_prod_price 
      FROM products 
      WHERE id::text = v_prod_id 
      LIMIT 1;
    END IF;

    -- Se não encontrar o produto no banco (ex: produto avulso no balcão), usa o preço enviado com fallback
    IF v_db_prod_price IS NULL THEN
      v_db_prod_price := COALESCE((v_item_json->'product'->>'price')::NUMERIC, 0);
    END IF;

    -- 2. Itera pelos complementos/adicionais do item
    v_extras_sum := 0;
    IF v_item_json->'selectedExtras' IS NOT NULL AND jsonb_typeof(v_item_json->'selectedExtras') = 'array' THEN
      FOR extra IN SELECT * FROM jsonb_array_elements(v_item_json->'selectedExtras')
      LOOP
        v_db_extra_price := NULL;
        IF (extra.value->>'id') IS NOT NULL THEN
          SELECT price INTO v_db_extra_price 
          FROM category_extra_items 
          WHERE id::text = (extra.value->>'id') 
          LIMIT 1;
        END IF;

        IF v_db_extra_price IS NULL THEN
          v_db_extra_price := COALESCE((extra.value->>'price')::NUMERIC, 0);
        END IF;

        v_extras_sum := v_extras_sum + v_db_extra_price;
      END LOOP;
    END IF;

    -- Acumula no subtotal oficial calculado no servidor
    v_calculated_subtotal := v_calculated_subtotal + ((v_db_prod_price + v_extras_sum) * v_item_qty);

    -- Atualiza o objeto do produto dentro do JSONB garantindo que o preço registrado seja o oficial
    v_product_json := (v_item_json->'product') || jsonb_build_object('price', v_db_prod_price);
    v_item_json := v_item_json || jsonb_build_object('product', v_product_json, 'quantity', v_item_qty);
    v_sanitized_items := v_sanitized_items || jsonb_build_array(v_item_json);
  END LOOP;

  -- 3. Atualiza os itens com os valores oficiais sanitizados
  NEW.items := v_sanitized_items;

  -- 4. Extrai a taxa de entrega
  IF NEW.delivery_info IS NOT NULL THEN
    v_delivery_fee := COALESCE((NEW.delivery_info->>'deliveryFee')::NUMERIC, 0);
  END IF;

  -- 5. Validação de Fraude no Total
  -- O total não pode ser negativo ou nulo se houver produtos no pedido.
  -- Permitimos descontos de cupons legítimos (até no máximo o subtotal), mas se o total for forjado
  -- como um valor absurdo (ex: R$ 0.01 ou R$ 0.00 sem cupom válido), o banco ajusta para o valor real calculado.
  IF NEW.total <= 0 OR NEW.total > (v_calculated_subtotal + v_delivery_fee + 100) THEN
    NEW.total := v_calculated_subtotal + v_delivery_fee;
  END IF;

  -- Se o cliente tentou injetar um valor menor que 50% do subtotal sem autorização
  IF NEW.total < ((v_calculated_subtotal + v_delivery_fee) * 0.5) AND v_calculated_subtotal > 15 THEN
    -- Auto-corrige o total para evitar perda financeira
    NEW.total := v_calculated_subtotal + v_delivery_fee;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Criação do Trigger na tabela `orders`
DROP TRIGGER IF EXISTS trg_validate_order_prices ON orders;

CREATE TRIGGER trg_validate_order_prices
BEFORE INSERT OR UPDATE OF items, total, delivery_info
ON orders
FOR EACH ROW
EXECUTE FUNCTION validate_order_prices_function();

-- Confirmação
COMMENT ON FUNCTION validate_order_prices_function() IS 'Valida e sanitiza os preços dos itens e total do pedido contra fraudes client-side.';
