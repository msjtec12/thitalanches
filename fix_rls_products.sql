-- =============================================================================
-- DEPRECATED — DO NOT RESTORE ANONYMOUS WRITE POLICIES
-- =============================================================================
-- This file previously fixed an RLS error by granting anonymous users full
-- INSERT/UPDATE/DELETE access to products/categories. That makes the database
-- writable by any visitor and is not a valid production fix.
--
-- Use the hardened migration instead:
--   1) production_security_v3.sql
--   2) production_admin_rpc_v3.sql
--   3) validate_order_prices_trigger.sql
--
-- This script now fails deliberately so it cannot accidentally reopen the
-- database if copied from an old tutorial/runbook.
-- =============================================================================

DO $$
BEGIN
  RAISE EXCEPTION 'fix_rls_products.sql is deprecated. Run production_security_v3.sql instead.';
END $$;
