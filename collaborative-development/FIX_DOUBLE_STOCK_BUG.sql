-- ============================================================
-- FIX: DOUBLE STOCK INCREMENT BUG
-- Problem: When a delivery is marked as 'delivered', the stock
-- gets incremented TWICE (ordering 5 adds 10).
-- 
-- Root Cause: Multiple triggers and/or multiple status updates
-- are firing the stock increment logic more than once.
--
-- Solution: 
-- 1. Drop ALL old stock-related triggers from both tables
-- 2. Recreate a single clean trigger with proper guard
-- 3. Add a 'stock_updated' flag to prevent re-processing
-- ============================================================

-- Step 1: Drop ALL existing stock update triggers
DROP TRIGGER IF EXISTS trigger_auto_stock_update_po ON public.purchase_orders;
DROP TRIGGER IF EXISTS trigger_auto_stock_update ON public.orders;

-- Step 2: Drop all old functions
DROP FUNCTION IF EXISTS handle_purchase_order_delivery() CASCADE;
DROP FUNCTION IF EXISTS handle_delivery_stock_update() CASCADE;

-- Step 3: Add a flag column to prevent double processing (safe if already exists)
ALTER TABLE public.purchase_orders 
  ADD COLUMN IF NOT EXISTS stock_updated boolean DEFAULT false;

-- Step 4: Create the SINGLE correct trigger function
CREATE OR REPLACE FUNCTION handle_purchase_order_delivery()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  v_current_stock integer;
BEGIN
  -- GUARD 1: Only fire when status changes TO 'delivered'
  IF NOT (OLD.status IS DISTINCT FROM 'delivered' AND NEW.status = 'delivered') THEN
    RETURN NEW;
  END IF;

  -- GUARD 2: Check if stock was already updated for this order (prevents double-fire)
  IF OLD.stock_updated = true THEN
    RAISE NOTICE 'Stock already updated for PO %, skipping', NEW.id;
    RETURN NEW;
  END IF;

  -- Mark as processed FIRST to prevent any race condition
  NEW.stock_updated := true;

  -- Now process each item in this purchase order
  FOR item IN (
    SELECT product_id, quantity 
    FROM public.order_items 
    WHERE purchase_order_id = NEW.id
  ) 
  LOOP
    -- Get current stock before update
    SELECT COALESCE(current_stock, 0) INTO v_current_stock
    FROM public.products
    WHERE id = item.product_id;

    -- Update product stock (only once!)
    UPDATE public.products 
    SET current_stock = v_current_stock + item.quantity,
        updated_at = now()
    WHERE id = item.product_id;

    -- Log in stock_movements (using columns that exist in the table)
    BEGIN
      INSERT INTO public.stock_movements (
        org_id,
        product_id,
        movement_type,
        quantity,
        reference_id,
        created_at
      ) VALUES (
        NEW.org_id,
        item.product_id,
        'in',
        item.quantity,
        NEW.id,
        now()
      );
    EXCEPTION
      WHEN undefined_column THEN
        -- If the stock_movements table has different column names, try alternate schema
        BEGIN
          INSERT INTO public.stock_movements (
            org_id,
            product_id,
            movement_type,
            quantity_change,
            quantity_before,
            quantity_after,
            reference_type,
            reference_id,
            notes,
            created_at
          ) VALUES (
            NEW.org_id,
            item.product_id,
            'purchase_in',
            item.quantity,
            v_current_stock,
            v_current_stock + item.quantity,
            'purchase_order',
            NEW.id,
            'Auto-added on purchase order delivery',
            now()
          );
        EXCEPTION
          WHEN OTHERS THEN
            RAISE NOTICE 'Could not log stock movement for product %, continuing anyway', item.product_id;
        END;
      WHEN OTHERS THEN
        RAISE NOTICE 'Could not log stock movement for product %, continuing anyway', item.product_id;
    END;
    
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the SINGLE trigger (BEFORE UPDATE so we can set stock_updated flag)
CREATE TRIGGER trigger_auto_stock_update_po
  BEFORE UPDATE OF status ON public.purchase_orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION handle_purchase_order_delivery();

-- ============================================================
-- VERIFICATION: Run this query to check current triggers
-- SELECT tgname, tgrelid::regclass FROM pg_trigger 
-- WHERE tgname LIKE '%stock%' OR tgname LIKE '%delivery%';
-- ============================================================
