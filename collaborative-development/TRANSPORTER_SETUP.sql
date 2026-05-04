-- ============================================================
-- TRANSPORTER MODULE SETUP (CORRECTED)
-- ============================================================

-- 1. Update Orders table with missing fields used in frontend
-- (These might already exist, but we use IF NOT EXISTS to be safe)
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS priority text DEFAULT 'Medium',
ADD COLUMN IF NOT EXISTS eta text DEFAULT 'TBD',
ADD COLUMN IF NOT EXISTS total_miles numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS due_time timestamptz;

-- 2. Create or Update Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate text NOT NULL,
  model text NOT NULL,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'In Transit')),
  health text NOT NULL DEFAULT 'Good' CHECK (health IN ('Good', 'Checkup', 'Critical')),
  battery_level text DEFAULT '100%',
  fuel_level text DEFAULT '100%',
  transporter_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Add missing columns to vehicles if they were partially created
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Add index for organization and transporter
CREATE INDEX IF NOT EXISTS idx_vehicles_org ON public.vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_trans ON public.vehicles(transporter_id);

-- Enable RLS
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Auto-fill organization_id trigger for vehicles
-- (Assuming auto_fill_org_id function already exists from main schema)
DROP TRIGGER IF EXISTS auto_org_vehicles ON public.vehicles;
CREATE TRIGGER auto_org_vehicles BEFORE INSERT ON public.vehicles FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

-- 3. Row Level Security Policies for Transporters

-- Clean up existing policies if any (to avoid "already exists" errors)
DROP POLICY IF EXISTS "transporter_view_orders" ON public.orders;
DROP POLICY IF EXISTS "transporter_update_orders" ON public.orders;
DROP POLICY IF EXISTS "transporter_insert_orders" ON public.orders;
DROP POLICY IF EXISTS "transporter_view_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "transporter_manage_vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "srv_vehicles" ON public.vehicles;

-- Order Policies for Transporters
CREATE POLICY "transporter_view_orders" ON public.orders
FOR SELECT USING (
  get_current_role() = 'transporter' AND 
  organization_id = get_current_org_id() AND 
  transporter_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

CREATE POLICY "transporter_update_orders" ON public.orders
FOR UPDATE USING (
  get_current_role() = 'transporter' AND 
  organization_id = get_current_org_id() AND 
  transporter_id = (SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1)
);

-- Vehicle Policies for Transporters
CREATE POLICY "transporter_view_vehicles" ON public.vehicles
FOR SELECT USING (
  get_current_role() = 'transporter' AND 
  organization_id = get_current_org_id()
);

CREATE POLICY "transporter_manage_vehicles" ON public.vehicles
FOR ALL USING (
  get_current_role() = 'transporter' AND 
  organization_id = get_current_org_id()
);

-- 4. Service Role Bypass for Vehicles
CREATE POLICY "srv_vehicles" ON public.vehicles FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- 5. TRANSPORTER ACCEPT/REJECT MIGRATION
-- Adds pending_acceptance, accepted, rejected to delivery_status
-- ============================================================

-- Drop the old CHECK constraint on delivery_status
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_delivery_status_check;

-- Add updated CHECK constraint with new statuses
ALTER TABLE public.orders ADD CONSTRAINT orders_delivery_status_check 
  CHECK (delivery_status IN ('not_assigned', 'pending_acceptance', 'accepted', 'rejected', 'in_transit', 'delivered'));

-- ============================================================
-- 6. AUTO STOCK UPDATE ON DELIVERY COMPLETION
-- ============================================================

-- Function to handle stock increment when an order is delivered
CREATE OR REPLACE FUNCTION handle_delivery_stock_update()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  -- Check if delivery_status just changed to 'delivered'
  IF (OLD.delivery_status IS DISTINCT FROM 'delivered' AND NEW.delivery_status = 'delivered') THEN
    
    -- Iterate through all order items associated with this order
    FOR item IN (SELECT product_id, quantity FROM public.order_items WHERE order_id = NEW.id) 
    LOOP
      -- 1. Increase the stock in the products table
      UPDATE public.products 
      SET stock = stock + item.quantity,
          updated_at = now()
      WHERE id = item.product_id;

      -- 2. Log the movement in stock_movements
      INSERT INTO public.stock_movements (
        organization_id, 
        product_id, 
        user_id, 
        order_id, 
        movement_type, 
        quantity, 
        stock_before, 
        stock_after, 
        reason
      )
      SELECT 
        NEW.organization_id,
        item.product_id,
        NEW.transporter_id, -- Using transporter ID to indicate who delivered it
        NEW.id,
        'IN',
        item.quantity,
        stock - item.quantity, -- Calculate stock_before
        stock,                 -- Current stock (which was just updated)
        'Order delivered by transporter'
      FROM public.products
      WHERE id = item.product_id;
      
    END LOOP;
    
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the orders table
DROP TRIGGER IF EXISTS trigger_auto_stock_update ON public.orders;

CREATE TRIGGER trigger_auto_stock_update
  AFTER UPDATE OF delivery_status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION handle_delivery_stock_update();
