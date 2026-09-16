-- THITA LANCHES — PROMOTE INITIAL ADMIN
-- This migration runs after staff_users is created by the security migration.
-- It promotes the pre-created Supabase Auth account to the application admin role.

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id
    INTO v_user_id
    FROM auth.users
   WHERE lower(email) = lower('admin@thitalanches.com')
   ORDER BY created_at DESC
   LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Required admin Auth user admin@thitalanches.com was not found. Create it before deploying this migration.';
  END IF;

  INSERT INTO public.staff_users (user_id, role, is_active, updated_at)
  VALUES (v_user_id, 'admin', TRUE, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    is_active = TRUE,
    updated_at = now();
END;
$$;

COMMENT ON TABLE public.staff_users IS
  'Authorized Thita Lanches staff identities linked to Supabase Auth users.';
