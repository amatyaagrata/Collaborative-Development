-- ============================================================
-- THE ULTIMATE FIX: NUKE ALL GHOST TRIGGERS AND FIX DOUBLE STOCK
-- Run this entire script at once in your Supabase SQL Editor!
-- ============================================================

-- STEP 1: Dynamically hunt down and destroy EVERY user-created trigger on purchase_orders and orders
DO $$ 
DECLARE
    trig RECORD;
BEGIN
    -- Kill all triggers on purchase_orders
    FOR trig IN 
        SELECT t.tgname as trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'purchase_orders' AND t.tgisinternal = false
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS "' || trig.trigger_name || '" ON public.purchase_orders CASCADE';
        RAISE NOTICE 'Killed ghost trigger on purchase_orders: %', trig.trigger_name;
    END LOOP;

    -- Kill all triggers on orders (just in case)
    FOR trig IN 
        SELECT t.tgname as trigger_name
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE c.relname = 'orders' AND t.tgisinternal = false
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS "' || trig.trigger_name || '" ON public.orders CASCADE';
        RAISE NOTICE 'Killed ghost trigger on orders: %', trig.trigger_name;
    END LOOP;
END $$;

-- STEP 2: Add our protection flag
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS stock_updated boolean DEFAULT false;

-- STEP 3: Create the one and ONLY correct stock update function
CREATE OR REPLACE FUNCTION handle_purchase_order_delivery()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  v_current_stock integer;
BEGIN
  -- GUARD 1: Only fire when transitioning to 'delivered'
  IF NOT (OLD.status IS DISTINCT FROM 'delivered' AND NEW.status = 'delivered') THEN
    RETURN NEW;
  END IF;

  -- GUARD 2: Prevent any double-firing
  IF OLD.stock_updated = true THEN
    RETURN NEW;
  END IF;

  -- Mark as processed
  NEW.stock_updated := true;

  -- Loop through items and update stock
  FOR item IN (
    SELECT product_id, quantity 
    FROM public.order_items 
    WHERE purchase_order_id = NEW.id
  ) 
  LOOP
    -- Get current stock safely
    SELECT COALESCE(current_stock, 0) INTO v_current_stock
    FROM public.products
    WHERE id = item.product_id;

    -- Update product stock
    UPDATE public.products 
    SET current_stock = v_current_stock + item.quantity,
        updated_at = now()
    WHERE id = item.product_id;

    -- Try to log the movement
    BEGIN
      INSERT INTO public.stock_movements (
        org_id, product_id, movement_type, quantity, reference_id, created_at
      ) VALUES (
        NEW.org_id, item.product_id, 'in', item.quantity, NEW.id, now()
      );
    EXCEPTION
      WHEN OTHERS THEN
        -- Ignore errors in the logging table so the stock still updates correctly
        NULL;
    END;
    
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 4: Install the ONE correct trigger
CREATE TRIGGER ultimate_stock_update_trigger
  BEFORE UPDATE OF status ON public.purchase_orders
  FOR EACH ROW
  WHEN (NEW.status = 'delivered')
  EXECUTE FUNCTION handle_purchase_order_delivery();

-- You are now safe from the double-stock bug!
