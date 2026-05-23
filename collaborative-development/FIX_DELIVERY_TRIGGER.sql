-- ============================================================
-- FIX: Correct the broken purchase_order delivery trigger
-- The trigger was using wrong column names for stock_movements
-- ============================================================

-- Drop the broken trigger first
DROP TRIGGER IF EXISTS trigger_auto_stock_update_po ON public.purchase_orders;
DROP FUNCTION IF EXISTS handle_purchase_order_delivery();

-- Also drop the old orders-based trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_stock_update ON public.orders;
DROP FUNCTION IF EXISTS handle_delivery_stock_update();

-- Recreate with CORRECT column names matching the actual stock_movements table
CREATE OR REPLACE FUNCTION handle_purchase_order_delivery()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  v_current_stock integer;
BEGIN
  -- Only fire when status changes TO 'delivered'
  IF (OLD.status IS DISTINCT FROM 'delivered' AND NEW.status = 'delivered') THEN
    
    FOR item IN (
      SELECT product_id, quantity 
      FROM public.order_items 
      WHERE purchase_order_id = NEW.id
    ) 
    LOOP
      -- Get current stock before update
      SELECT current_stock INTO v_current_stock
      FROM public.products
      WHERE id = item.product_id;

      -- Update product stock
      UPDATE public.products 
      SET current_stock = COALESCE(current_stock, 0) + item.quantity,
          updated_at = now()
      WHERE id = item.product_id;

      -- Log in stock_movements using CORRECT column names
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
        COALESCE(v_current_stock, 0),
        COALESCE(v_current_stock, 0) + item.quantity,
        'purchase_order',
        NEW.id,
        'Auto-added on purchase order delivery',
        now()
      );
      
    END LOOP;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create the trigger
CREATE TRIGGER trigger_auto_stock_update_po
  AFTER UPDATE OF status ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_purchase_order_delivery();
