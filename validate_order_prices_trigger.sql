-- ==============================================================================
-- THITA LANCHES — SERVER-SIDE ORDER PRICE VALIDATION
-- Never trust prices, totals, delivery fees or extra prices sent by the browser.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.validate_order_prices_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item JSONB;
  v_extra JSONB;
  v_product_id TEXT;
  v_product_price NUMERIC(10,2);
  v_quantity INTEGER;
  v_extra_price NUMERIC(10,2);
  v_extras_total NUMERIC(10,2);
  v_subtotal NUMERIC(10,2) := 0;
  v_delivery_fee NUMERIC(10,2) := 0;
  v_distance NUMERIC(10,2);
  v_sanitized_items JSONB := '[]'::JSONB;
  v_product_json JSONB;
  v_extras_json JSONB;
BEGIN
  -- A bill_request is an operational event, not a sale. It intentionally has no
  -- line items and may not carry a customer-controlled monetary total.
  IF COALESCE(NEW.order_type, 'sale') = 'bill_request' THEN
    IF NEW.origin <> 'table' THEN
      RAISE EXCEPTION 'bill requests are only valid for table orders';
    END IF;
    NEW.items := '[]'::JSONB;
    NEW.total := 0;
    NEW.delivery_info := NULL;
    NEW.payment_status := 'pending';
    NEW.status := 'received';
    RETURN NEW;
  END IF;

  IF NEW.items IS NULL OR jsonb_typeof(NEW.items) <> 'array' OR jsonb_array_length(NEW.items) = 0 THEN
    RAISE EXCEPTION 'O pedido deve conter pelo menos um item válido.';
  END IF;

  IF jsonb_array_length(NEW.items) > 50 THEN
    RAISE EXCEPTION 'Quantidade de itens acima do limite permitido.';
  END IF;

  FOR v_item IN SELECT value FROM jsonb_array_elements(NEW.items)
  LOOP
    v_product_id := v_item->'product'->>'id';
    IF v_product_id IS NULL OR length(v_product_id) > 100 THEN
      RAISE EXCEPTION 'Produto inválido.';
    END IF;

    BEGIN
      v_quantity := COALESCE((v_item->>'quantity')::INTEGER, 1);
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Quantidade de produto inválida.';
    END;

    IF v_quantity < 1 OR v_quantity > 99 THEN
      RAISE EXCEPTION 'Quantidade de produto fora do limite permitido.';
    END IF;

    SELECT p.price
      INTO v_product_price
      FROM public.products p
     WHERE p.id::TEXT = v_product_id
       AND p.is_active = TRUE
     LIMIT 1;

    IF v_product_price IS NULL THEN
      RAISE EXCEPTION 'Produto inexistente ou indisponível: %', v_product_id;
    END IF;

    v_extras_total := 0;
    v_extras_json := '[]'::JSONB;

    IF v_item ? 'selectedExtras' THEN
      IF jsonb_typeof(v_item->'selectedExtras') <> 'array' THEN
        RAISE EXCEPTION 'Complementos inválidos.';
      END IF;

      IF jsonb_array_length(v_item->'selectedExtras') > 30 THEN
        RAISE EXCEPTION 'Quantidade de complementos acima do limite.';
      END IF;

      FOR v_extra IN SELECT value FROM jsonb_array_elements(v_item->'selectedExtras')
      LOOP
        IF v_extra->>'id' IS NULL THEN
          RAISE EXCEPTION 'Complemento sem identificador.';
        END IF;

        SELECT e.price
          INTO v_extra_price
          FROM public.category_extra_items e
         WHERE e.id::TEXT = (v_extra->>'id')
           AND e.is_active = TRUE
         LIMIT 1;

        IF v_extra_price IS NULL THEN
          RAISE EXCEPTION 'Complemento inexistente ou indisponível: %', v_extra->>'id';
        END IF;

        v_extras_total := v_extras_total + v_extra_price;
        v_extras_json := v_extras_json || jsonb_build_array(
          v_extra || jsonb_build_object('price', v_extra_price)
        );
      END LOOP;
    END IF;

    v_subtotal := v_subtotal + ((v_product_price + v_extras_total) * v_quantity);
    v_product_json := (v_item->'product') || jsonb_build_object('price', v_product_price);
    v_item := v_item || jsonb_build_object(
      'product', v_product_json,
      'quantity', v_quantity,
      'selectedExtras', v_extras_json
    );
    v_sanitized_items := v_sanitized_items || jsonb_build_array(v_item);
  END LOOP;

  NEW.items := v_sanitized_items;

  -- Delivery fee is derived from the distance band, never from deliveryFee sent
  -- by the browser. Distances beyond 12 km are rejected.
  IF NEW.pickup_type = 'delivery' THEN
    IF NEW.delivery_info IS NULL THEN
      RAISE EXCEPTION 'Informações de entrega são obrigatórias.';
    END IF;

    BEGIN
      v_distance := (NEW.delivery_info->>'distanceKm')::NUMERIC;
    EXCEPTION WHEN invalid_text_representation THEN
      RAISE EXCEPTION 'Distância de entrega inválida.';
    END;

    IF v_distance IS NULL OR v_distance < 0 OR v_distance > 12 THEN
      RAISE EXCEPTION 'Endereço fora da área de entrega.';
    END IF;

    v_delivery_fee := CASE
      WHEN v_distance <= 1 THEN 3.00
      WHEN v_distance <= 2 THEN 4.25
      WHEN v_distance <= 3 THEN 5.50
      WHEN v_distance <= 4 THEN 6.75
      WHEN v_distance <= 5 THEN 8.00
      WHEN v_distance <= 6 THEN 9.25
      WHEN v_distance <= 7 THEN 10.50
      WHEN v_distance <= 8 THEN 11.75
      WHEN v_distance <= 9 THEN 13.00
      WHEN v_distance <= 10 THEN 14.25
      WHEN v_distance <= 11 THEN 15.50
      ELSE 16.75
    END;

    NEW.delivery_info := NEW.delivery_info || jsonb_build_object('deliveryFee', v_delivery_fee);
  ELSE
    v_delivery_fee := 0;
    IF NEW.delivery_info IS NOT NULL THEN
      NEW.delivery_info := NEW.delivery_info - 'deliveryFee';
    END IF;
  END IF;

  NEW.total := round(v_subtotal + v_delivery_fee, 2);

  IF NEW.total < 0 THEN
    RAISE EXCEPTION 'Total inválido.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_order_prices ON public.orders;
CREATE TRIGGER trg_validate_order_prices
BEFORE INSERT OR UPDATE OF items, total, delivery_info, pickup_type, order_type
ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.validate_order_prices_function();

REVOKE ALL ON FUNCTION public.validate_order_prices_function() FROM PUBLIC;
COMMENT ON FUNCTION public.validate_order_prices_function() IS
  'Canonicaliza preços, complementos, quantidade, entrega e total no servidor; aceita bill_request com valor zero.';
