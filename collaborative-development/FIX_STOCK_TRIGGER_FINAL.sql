-- ============================================================
-- FIX: Correct Auto-Stock Update Trigger
-- 1. Updates 'purchase_orders' instead of 'orders'
-- 2. Uses 'current_stock' instead of 'stock'
-- ============================================================

-- Function to handle stock increment when a purchase order is delivered
CREATE OR REPLACE FUNCTION handle_purchase_order_delivery()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Check if status just changed to 'delivered'
  IF (OLD.status IS DISTINCT FROM 'delivered' AND NEW.status = 'delivered') THEN
    
    -- Iterate through all order items associated with this purchase order
    FOR item IN (SELECT product_id, quantity FROM public.order_items WHERE purchase_order_id = NEW.id) 
    LOOP
      -- 1. Increase the current_stock in the products table
      UPDATE public.products 
      SET current_stock = current_stock + item.quantity,
          updated_at = now()
      WHERE id = item.product_id;

      -- 2. Log the movement in stock_movements
      INSERT INTO public.stock_movements (
        org_id, 
        product_id, 
        order_id, 
        movement_type, 
        quantity, 
        stock_before, 
        stock_after, 
        reason
      )
      SELECT 
        NEW.org_id,
        item.product_id,
        NEW.id,
        'in',
        item.quantity,
        current_stock - item.quantity, -- Calculate stock_before
        current_stock,                 -- Current stock (which was just updated)
        'Purchase order delivered'
      FROM public.products
      WHERE id = item.product_id;
      
    END LOOP;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the purchase_orders table
DROP TRIGGER IF EXISTS trigger_auto_stock_update_po ON public.purchase_orders;

CREATE TRIGGER trigger_auto_stock_update_po
  AFTER UPDATE OF status ON public.purchase_orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_purchase_order_delivery();

-- Cleanup the old incorrect trigger if it exists
DROP TRIGGER IF EXISTS trigger_auto_stock_update ON public.orders;
DROP FUNCTION IF EXISTS handle_delivery_stock_update();
