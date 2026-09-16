-- =============================================================================
-- THITA LANCHES — PRODUCTION SECURITY V3
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.staff_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.staff_users FROM anon, authenticated;
GRANT SELECT ON public.staff_users TO authenticated;

DROP POLICY IF EXISTS "staff_read_own_profile" ON public.staff_users;
CREATE POLICY "staff_read_own_profile"
ON public.staff_users
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.is_staff_member(
  required_roles TEXT[] DEFAULT ARRAY['admin', 'employee']::TEXT[]
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.staff_users s
    WHERE s.user_id = (SELECT auth.uid())
      AND s.is_active = TRUE
      AND s.role = ANY(required_roles)
  );
$$;

REVOKE ALL ON FUNCTION public.is_staff_member(TEXT[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_member(TEXT[]) TO authenticated;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_type TEXT NOT NULL DEFAULT 'sale',
  ADD COLUMN IF NOT EXISTS pix_proof_path TEXT,
  ADD COLUMN IF NOT EXISTS pix_proof_url TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_order_type_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_order_type_check
      CHECK (order_type IN ('sale', 'bill_request'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_orders_customer_user_id
  ON public.orders(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON public.orders(created_at DESC);

DROP FUNCTION IF EXISTS public.verify_admin_pin(TEXT);
ALTER TABLE public.store_settings DROP COLUMN IF EXISTS admin_pin;

DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'store_settings', 'neighborhoods', 'categories',
        'category_extra_groups', 'category_extra_items', 'products',
        'orders', 'cashier_logs'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.neighborhoods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_extra_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_extra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.cashier_logs') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.cashier_logs ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;

REVOKE ALL ON public.categories FROM anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;

CREATE POLICY "categories_public_read"
ON public.categories FOR SELECT TO anon, authenticated
USING (is_active = TRUE);
CREATE POLICY "categories_staff_read_all"
ON public.categories FOR SELECT TO authenticated
USING (public.is_staff_member());
CREATE POLICY "categories_staff_insert"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (public.is_staff_member(ARRAY['admin']));
CREATE POLICY "categories_staff_update"
ON public.categories FOR UPDATE TO authenticated
USING (public.is_staff_member(ARRAY['admin']))
WITH CHECK (public.is_staff_member(ARRAY['admin']));
CREATE POLICY "categories_staff_delete"
ON public.categories FOR DELETE TO authenticated
USING (public.is_staff_member(ARRAY['admin']));

REVOKE ALL ON public.category_extra_groups FROM anon, authenticated;
GRANT SELECT ON public.category_extra_groups TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.category_extra_groups TO authenticated;

CREATE POLICY "extra_groups_public_read"
ON public.category_extra_groups FOR SELECT TO anon, authenticated
USING (is_active = TRUE);
CREATE POLICY "extra_groups_staff_read_all"
ON public.category_extra_groups FOR SELECT TO authenticated
USING (public.is_staff_member());
CREATE POLICY "extra_groups_staff_write"
ON public.category_extra_groups FOR ALL TO authenticated
USING (public.is_staff_member(ARRAY['admin']))
WITH CHECK (public.is_staff_member(ARRAY['admin']));

REVOKE ALL ON public.category_extra_items FROM anon, authenticated;
GRANT SELECT ON public.category_extra_items TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.category_extra_items TO authenticated;

CREATE POLICY "extra_items_public_read"
ON public.category_extra_items FOR SELECT TO anon, authenticated
USING (is_active = TRUE);
CREATE POLICY "extra_items_staff_read_all"
ON public.category_extra_items FOR SELECT TO authenticated
USING (public.is_staff_member());
CREATE POLICY "extra_items_staff_write"
ON public.category_extra_items FOR ALL TO authenticated
USING (public.is_staff_member(ARRAY['admin']))
WITH CHECK (public.is_staff_member(ARRAY['admin']));

REVOKE ALL ON public.products FROM anon, authenticated;
GRANT SELECT (
  id, category_id, name, description, price, is_active, image_url,
  is_combo, combo_items, sort_order, disabled_extra_ids, badge, created_at
) ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;

CREATE POLICY "products_public_read"
ON public.products FOR SELECT TO anon, authenticated
USING (is_active = TRUE);
CREATE POLICY "products_staff_read_all"
ON public.products FOR SELECT TO authenticated
USING (public.is_staff_member());
CREATE POLICY "products_staff_insert"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.is_staff_member(ARRAY['admin']));
CREATE POLICY "products_staff_update"
ON public.products FOR UPDATE TO authenticated
USING (public.is_staff_member(ARRAY['admin']))
WITH CHECK (public.is_staff_member(ARRAY['admin']));
CREATE POLICY "products_staff_delete"
ON public.products FOR DELETE TO authenticated
USING (public.is_staff_member(ARRAY['admin']));

CREATE OR REPLACE FUNCTION public.get_staff_products()
RETURNS SETOF public.products
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_staff_member(ARRAY['admin']) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  RETURN QUERY
    SELECT * FROM public.products ORDER BY sort_order, name;
END;
$$;
REVOKE ALL ON FUNCTION public.get_staff_products() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_staff_products() TO authenticated;

REVOKE ALL ON public.neighborhoods FROM anon, authenticated;
GRANT SELECT ON public.neighborhoods TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.neighborhoods TO authenticated;
CREATE POLICY "neighborhoods_public_read"
ON public.neighborhoods FOR SELECT TO anon, authenticated USING (TRUE);
CREATE POLICY "neighborhoods_admin_write"
ON public.neighborhoods FOR ALL TO authenticated
USING (public.is_staff_member(ARRAY['admin']))
WITH CHECK (public.is_staff_member(ARRAY['admin']));

REVOKE ALL ON public.store_settings FROM anon, authenticated;
GRANT SELECT ON public.store_settings TO anon, authenticated;
GRANT UPDATE ON public.store_settings TO authenticated;
CREATE POLICY "settings_public_read"
ON public.store_settings FOR SELECT TO anon, authenticated USING (id = 1);
CREATE POLICY "settings_admin_update"
ON public.store_settings FOR UPDATE TO authenticated
USING (id = 1 AND public.is_staff_member(ARRAY['admin']))
WITH CHECK (id = 1 AND public.is_staff_member(ARRAY['admin']));

REVOKE ALL ON public.orders FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;

CREATE POLICY "orders_customer_read_own"
ON public.orders FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = customer_user_id);
CREATE POLICY "orders_staff_read_all"
ON public.orders FOR SELECT TO authenticated
USING (public.is_staff_member());

CREATE POLICY "orders_customer_insert_own"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = customer_user_id
  AND NOT public.is_staff_member()
  AND origin IN ('online', 'table', 'counter_qr')
  AND status = 'received'
  AND payment_status = 'pending'
  AND COALESCE(is_printed, FALSE) = FALSE
);
CREATE POLICY "orders_staff_insert"
ON public.orders FOR INSERT TO authenticated
WITH CHECK (public.is_staff_member());
CREATE POLICY "orders_staff_update"
ON public.orders FOR UPDATE TO authenticated
USING (public.is_staff_member())
WITH CHECK (public.is_staff_member());
CREATE POLICY "orders_staff_delete"
ON public.orders FOR DELETE TO authenticated
USING (public.is_staff_member(ARRAY['admin']));

CREATE OR REPLACE FUNCTION public.attach_order_pix_proof(
  p_order_id UUID,
  p_storage_path TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid UUID := (SELECT auth.uid());
  v_owner UUID;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;

  IF p_storage_path IS NULL OR length(p_storage_path) > 500 THEN
    RAISE EXCEPTION 'invalid proof path';
  END IF;

  SELECT customer_user_id INTO v_owner
  FROM public.orders
  WHERE id = p_order_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'order not found';
  END IF;

  IF v_owner <> v_uid AND NOT public.is_staff_member() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  IF split_part(p_storage_path, '/', 1) <> v_uid::TEXT THEN
    RAISE EXCEPTION 'invalid proof ownership';
  END IF;

  UPDATE public.orders
  SET pix_proof_path = p_storage_path
  WHERE id = p_order_id;
END;
$$;
REVOKE ALL ON FUNCTION public.attach_order_pix_proof(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.attach_order_pix_proof(UUID, TEXT) TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('pix-proofs', 'pix-proofs', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

DO $$
DECLARE
  p RECORD;
BEGIN
  FOR p IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname IN (
        'pix_proofs_owner_insert', 'pix_proofs_owner_read',
        'pix_proofs_staff_read', 'pix_proofs_owner_delete',
        'Public Upload Category Images', 'Public Read Category Images',
        'staff_catalog_images_insert', 'staff_catalog_images_update',
        'staff_catalog_images_delete', 'public_catalog_images_read'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

CREATE POLICY "pix_proofs_owner_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'pix-proofs'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
);
CREATE POLICY "pix_proofs_owner_read"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'pix-proofs'
  AND (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
);
CREATE POLICY "pix_proofs_staff_read"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'pix-proofs' AND public.is_staff_member());
CREATE POLICY "pix_proofs_owner_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'pix-proofs'
  AND (
    (storage.foldername(name))[1] = (SELECT auth.uid())::TEXT
    OR public.is_staff_member(ARRAY['admin'])
  )
);

CREATE POLICY "public_catalog_images_read"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id IN ('category-images', 'product-images'));
CREATE POLICY "staff_catalog_images_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('category-images', 'product-images')
  AND public.is_staff_member(ARRAY['admin'])
);
CREATE POLICY "staff_catalog_images_update"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id IN ('category-images', 'product-images')
  AND public.is_staff_member(ARRAY['admin'])
)
WITH CHECK (
  bucket_id IN ('category-images', 'product-images')
  AND public.is_staff_member(ARRAY['admin'])
);
CREATE POLICY "staff_catalog_images_delete"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id IN ('category-images', 'product-images')
  AND public.is_staff_member(ARRAY['admin'])
);

DO $$
BEGIN
  IF to_regclass('public.cashier_logs') IS NOT NULL THEN
    EXECUTE 'REVOKE ALL ON public.cashier_logs FROM anon, authenticated';
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.cashier_logs TO authenticated';
    EXECUTE 'CREATE POLICY "cashier_logs_staff_all" ON public.cashier_logs FOR ALL TO authenticated USING (public.is_staff_member()) WITH CHECK (public.is_staff_member())';
  END IF;
END $$;

COMMIT;
