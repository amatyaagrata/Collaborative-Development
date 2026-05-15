-- ============================================================
-- FIX: Update delivery_status CHECK constraint to include
-- pending_acceptance, accepted, and rejected values
-- ============================================================
-- The original DATABASE_SCHEMA_V3.sql only allows:
--   ('not_assigned', 'in_transit', 'delivered')
-- But the transporter accept/reject flow requires:
--   ('pending_acceptance', 'accepted', 'rejected')
-- ============================================================

-- Drop the old constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_status_check;

-- Add the updated constraint with all valid statuses
ALTER TABLE public.orders ADD CONSTRAINT orders_delivery_status_check 
  CHECK (delivery_status IN (
    'not_assigned', 
    'pending_acceptance', 
    'accepted', 
    'rejected', 
    'in_transit', 
    'delivered'
  ));

-- Verify: Check if transporter RLS update policy exists
-- If it doesn't, create it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'orders' 
    AND policyname = 'transporter_update_orders'
  ) THEN
    EXECUTE 'CREATE POLICY "transporter_update_orders" ON public.orders
      FOR UPDATE USING (
        get_current_role() = ''transporter'' AND 
        organization_id = get_current_org_id() AND 
        transporter_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
      )';
    RAISE NOTICE 'Created transporter_update_orders policy';
  ELSE
    RAISE NOTICE 'transporter_update_orders policy already exists';
  END IF;
END $$;
