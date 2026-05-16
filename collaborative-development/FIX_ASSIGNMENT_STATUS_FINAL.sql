-- ============================================================
-- FIX: Update order_driver_assignments status CHECK constraint
-- to include 'in_transit' and 'delivered'
-- ============================================================

-- 1. Drop the existing constraint
ALTER TABLE public.order_driver_assignments 
DROP CONSTRAINT IF EXISTS order_driver_assignments_status_check;

-- 2. Add the updated constraint with all required statuses
ALTER TABLE public.order_driver_assignments 
ADD CONSTRAINT order_driver_assignments_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'in_transit', 'delivered'));

-- 3. Also ensure the purchase_orders and orders tables have matching constraints
-- (Just in case, as we've seen mismatches before)
ALTER TABLE public.purchase_orders 
DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE public.purchase_orders 
ADD CONSTRAINT purchase_orders_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'driver_assigned', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'in_transit', 'delivered', 'cancelled'));

-- Log success
COMMENT ON CONSTRAINT order_driver_assignments_status_check ON public.order_driver_assignments IS 'Allows full delivery lifecycle statuses';
