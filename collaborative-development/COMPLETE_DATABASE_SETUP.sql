-- ============================================================
-- COMPLETE DATABASE SETUP FOR COLLABORATIVE DEVELOPMENT
-- ============================================================
-- This is the ONLY SQL file you need to run in Supabase
-- It includes:
-- 1. Table creation with correct structure
-- 2. All RLS policies configured for service role
-- 3. All triggers for timestamp maintenance
-- 4. Sample data for testing
-- 
-- HOW TO USE:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Click "New Query"
-- 3. Copy & paste this entire file
-- 4. Click "Execute" / "Run"
-- 5. Wait for completion
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the timestamp update function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- DROP SECRETS & BROKEN TRIGGERS (Cleans up auth.users)
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;

-- ============================================================
-- DROP ALL EXISTING TABLES (safe drop in reverse dependency order)
-- ============================================================
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS driver_assignments CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- CREATE USERS TABLE (application-level, separate from auth.users)
-- ============================================================
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'inventory manager',
  phone text,
  organization_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'supplier', 'transporter', 'inventory manager'))
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- CREATE CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CREATE SUPPLIERS TABLE
-- ============================================================
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_suppliers_name ON suppliers(name);

-- ============================================================
-- CREATE ORGANIZATIONS TABLE
-- ============================================================
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_organizations_name ON organizations(name);

-- ============================================================
-- CREATE PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sku text UNIQUE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_supplier ON products(supplier_id);

-- ============================================================
-- CREATE ORDERS TABLE
-- ============================================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  product_name text,
  supplier_name text,
  custom_product_id text,
  category text,
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  delivery_address text,
  customer_name text,
  customer_email text,
  customer_phone text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_status_check CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled'))
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_supplier ON orders(supplier_id);
CREATE INDEX idx_orders_status ON orders(status);

-- ============================================================
-- CREATE ORDER_ITEMS TABLE (line items)
-- ============================================================
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- ============================================================
-- CREATE DELIVERIES TABLE
-- ============================================================
CREATE TABLE deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  delivery_date timestamptz,
  tracking_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT deliveries_status_check CHECK (status IN ('pending', 'in_transit', 'delivered', 'returned', 'cancelled'))
);

CREATE INDEX idx_deliveries_order ON deliveries(order_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);

-- ============================================================
-- CREATE DRIVER_ASSIGNMENTS TABLE
-- ============================================================
CREATE TABLE driver_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid REFERENCES users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  pickup_address text,
  delivery_charge numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'assigned',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT driver_assignments_status_check CHECK (status IN ('assigned', 'accepted', 'in_transit', 'delivered', 'cancelled'))
);

CREATE INDEX idx_driver_assignments_driver ON driver_assignments(driver_id);
CREATE INDEX idx_driver_assignments_order ON driver_assignments(order_id);
CREATE INDEX idx_driver_assignments_status ON driver_assignments(status);

-- ============================================================
-- CREATE USER_ROLES TABLE (RBAC)
-- ============================================================
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'inventory manager',
  organization_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'supplier', 'transporter', 'inventory manager')),
  UNIQUE(user_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- ============================================================
-- CREATE NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT notifications_type_check CHECK (type IN ('order', 'alert', 'system'))
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- CREATE TRIGGERS FOR TIMESTAMP MAINTENANCE
-- ============================================================
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_categories BEFORE UPDATE ON categories 
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_suppliers BEFORE UPDATE ON suppliers 
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_organizations BEFORE UPDATE ON organizations 
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_products BEFORE UPDATE ON products 
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_orders BEFORE UPDATE ON orders 
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_order_items BEFORE UPDATE ON order_items 
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_deliveries BEFORE UPDATE ON deliveries 
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_driver_assignments BEFORE UPDATE ON driver_assignments 
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_user_roles BEFORE UPDATE ON user_roles 
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE TRIGGER set_timestamp_notifications BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- ============================================================
-- INSERT SAMPLE DATA
-- ============================================================

-- Sample categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and accessories'),
('Clothing', 'Apparel and fashion items'),
('Food & Beverages', 'Food products and drinks'),
('Home & Garden', 'Home improvement and garden supplies'),
('Books', 'Books and educational materials');

-- Sample suppliers
INSERT INTO suppliers (name, contact_email, contact_phone, address) VALUES
('TechCorp Supplies', 'contact@techcorp.com', '+1-555-0101', '123 Tech Street, Silicon Valley, CA'),
('Fashion Forward Inc', 'sales@fashionfwd.com', '+1-555-0102', '456 Fashion Ave, New York, NY'),
('Fresh Foods Ltd', 'orders@freshfoods.com', '+1-555-0103', '789 Food Plaza, Chicago, IL'),
('Home Depot Wholesale', 'wholesale@homedepot.com', '+1-555-0104', '321 Construction Rd, Atlanta, GA'),
('BookWorld Publishers', 'distribution@bookworld.com', '+1-555-0105', '654 Reading Lane, Boston, MA');

-- Sample products
INSERT INTO products (name, description, sku, category_id, supplier_id, price, stock, min_stock_level) VALUES
('Wireless Headphones', 'High-quality wireless headphones with noise cancellation', 'WH-001', (SELECT id FROM categories WHERE name = 'Electronics'), (SELECT id FROM suppliers WHERE name = 'TechCorp Supplies'), 199.99, 50, 10),
('Cotton T-Shirt', 'Comfortable 100% cotton t-shirt', 'TS-001', (SELECT id FROM categories WHERE name = 'Clothing'), (SELECT id FROM suppliers WHERE name = 'Fashion Forward Inc'), 29.99, 100, 20),
('Organic Apples', 'Fresh organic apples, 1kg pack', 'AP-001', (SELECT id FROM categories WHERE name = 'Food & Beverages'), (SELECT id FROM suppliers WHERE name = 'Fresh Foods Ltd'), 4.99, 200, 30),
('Garden Hose', 'Durable 50ft garden hose', 'GH-001', (SELECT id FROM categories WHERE name = 'Home & Garden'), (SELECT id FROM suppliers WHERE name = 'Home Depot Wholesale'), 39.99, 75, 15),
('Programming Book', 'Learn JavaScript programming', 'BK-001', (SELECT id FROM categories WHERE name = 'Books'), (SELECT id FROM suppliers WHERE name = 'BookWorld Publishers'), 49.99, 30, 5);

-- Sample organizations
INSERT INTO organizations (name, address, phone, email) VALUES
('ABC Corporation', '100 Business St, Business City, BC 12345', '+1-555-1000', 'contact@abc.com'),
('XYZ Industries', '200 Industrial Ave, Industry Town, IT 67890', '+1-555-2000', 'info@xyz.com'),
('Global Enterprises', '300 Corporate Blvd, Corporate City, CC 54321', '+1-555-3000', 'hello@global.com');

-- ============================================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - SERVICE ROLE (Server-side, unrestricted access)
-- ============================================================
-- These allow your Next.js server to create/update profiles during signup

CREATE POLICY "service_role_all_users" ON users 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_user_roles" ON user_roles 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_categories" ON categories 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_suppliers" ON suppliers 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_organizations" ON organizations 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_products" ON products 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_orders" ON orders 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_order_items" ON order_items 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_deliveries" ON deliveries 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_driver_assignments" ON driver_assignments 
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "service_role_all_notifications" ON notifications 
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- RLS POLICIES - AUTHENTICATED USERS (Client-side, limited access)
-- ============================================================

-- Users can view their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Users can view and update their own roles
CREATE POLICY "Users can view own role" ON user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own role" ON user_roles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can view notifications sent to them
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- RLS POLICIES - PUBLIC (Anyone can read catalog)
-- ============================================================

CREATE POLICY "Anyone can view categories" ON categories
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view products" ON products
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view suppliers" ON suppliers
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view organizations" ON organizations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can view orders" ON orders
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view order items" ON order_items
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- RLS POLICIES - INVENTORY MANAGER / ADMIN WRITE ACCESS
-- ============================================================
-- Allow authenticated admin and inventory manager users to manage catalog + orders.
-- Role is resolved from user_roles table keyed by auth.uid().

CREATE POLICY "Inventory roles can insert products" ON products
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

CREATE POLICY "Inventory roles can update products" ON products
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

CREATE POLICY "Inventory roles can delete products" ON products
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

CREATE POLICY "Inventory roles can insert categories" ON categories
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

CREATE POLICY "Inventory roles can update categories" ON categories
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

CREATE POLICY "Inventory roles can delete categories" ON categories
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

CREATE POLICY "Inventory roles can insert orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

CREATE POLICY "Inventory roles can update orders" ON orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

CREATE POLICY "Inventory roles can delete orders" ON orders
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

CREATE POLICY "Inventory roles can insert order items" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

CREATE POLICY "Inventory roles can update order items" ON order_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

CREATE POLICY "Inventory roles can delete order items" ON order_items
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'inventory manager')
    )
  );

-- ============================================================
-- RLS POLICIES - AUTHENTICATED FALLBACK FOR ORDER FLOW
-- ============================================================
-- Keeps order creation functional even when user_roles row is missing.
-- You can tighten/remove these once role bootstrap is guaranteed.

CREATE POLICY "Authenticated users can insert orders" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update orders" ON orders
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete orders" ON orders
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert order items" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update order items" ON order_items
  FOR UPDATE TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete order items" ON order_items
  FOR DELETE TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================
-- SUCCESS - Database setup complete!
-- ============================================================
-- All tables, triggers, RLS policies, and sample data have been created.
-- Your Next.js app can now:
-- 1. Sign up new users (via service role API)
-- 2. Manage products, orders, and deliveries
-- 3. Control access with role-based policies
-- 4. Track changes with automatic timestamps
