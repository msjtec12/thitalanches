-- THITA LANCHES — STAFF-ONLY PRODUCT MUTATION RPC
-- Run after production_security_v3.sql.

CREATE OR REPLACE FUNCTION public.staff_upsert_product(
  p_id UUID,
  p_name TEXT,
  p_description TEXT,
  p_price NUMERIC,
  p_cost_price NUMERIC,
  p_category_id UUID,
  p_is_active BOOLEAN,
  p_image_url TEXT,
  p_is_combo BOOLEAN,
  p_combo_items JSONB,
  p_sort_order INTEGER,
  p_disabled_extra_ids JSONB,
  p_badge TEXT
)
RETURNS public.products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_product public.products;
BEGIN
  IF NOT public.is_staff_member(ARRAY['admin']) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF p_name IS NULL OR length(trim(p_name)) < 2 OR length(p_name) > 160 THEN
    RAISE EXCEPTION 'invalid product name';
  END IF;
  IF p_price IS NULL OR p_price < 0 OR p_price > 99999 THEN
    RAISE EXCEPTION 'invalid product price';
  END IF;
  IF p_cost_price IS NOT NULL AND (p_cost_price < 0 OR p_cost_price > 99999) THEN
    RAISE EXCEPTION 'invalid product cost';
  END IF;
  IF p_badge IS NOT NULL AND p_badge NOT IN ('bestseller', 'promo', 'new', 'highlight') THEN
    RAISE EXCEPTION 'invalid badge';
  END IF;

  IF p_id IS NULL THEN
    INSERT INTO public.products (
      name, description, price, cost_price, category_id, is_active, image_url,
      is_combo, combo_items, sort_order, disabled_extra_ids, badge
    ) VALUES (
      trim(p_name), p_description, p_price, p_cost_price, p_category_id,
      COALESCE(p_is_active, TRUE), p_image_url, COALESCE(p_is_combo, FALSE),
      COALESCE(p_combo_items, '[]'::JSONB), COALESCE(p_sort_order, 0),
      COALESCE(p_disabled_extra_ids, '[]'::JSONB), p_badge
    ) RETURNING * INTO v_product;
  ELSE
    UPDATE public.products
       SET name = trim(p_name),
           description = p_description,
           price = p_price,
           cost_price = p_cost_price,
           category_id = p_category_id,
           is_active = COALESCE(p_is_active, TRUE),
           image_url = p_image_url,
           is_combo = COALESCE(p_is_combo, FALSE),
           combo_items = COALESCE(p_combo_items, '[]'::JSONB),
           sort_order = COALESCE(p_sort_order, 0),
           disabled_extra_ids = COALESCE(p_disabled_extra_ids, '[]'::JSONB),
           badge = p_badge
     WHERE id = p_id
     RETURNING * INTO v_product;

    IF v_product.id IS NULL THEN
      RAISE EXCEPTION 'product not found';
    END IF;
  END IF;

  RETURN v_product;
END;
$$;

REVOKE ALL ON FUNCTION public.staff_upsert_product(UUID, TEXT, TEXT, NUMERIC, NUMERIC, UUID, BOOLEAN, TEXT, BOOLEAN, JSONB, INTEGER, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.staff_upsert_product(UUID, TEXT, TEXT, NUMERIC, NUMERIC, UUID, BOOLEAN, TEXT, BOOLEAN, JSONB, INTEGER, JSONB, TEXT) TO authenticated;
