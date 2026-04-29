-- ============================================================
-- GOGODAM DATABASE SCHEMA V3 - STRICT MULTI-TENANT ISOLATION
-- ============================================================
-- This is the single master file requested. It contains:
-- 1. Complete cleanup of old tables
-- 2. All required tables (organizations, users, roles, suppliers, categories, products, orders, order_items, etc.)
-- 3. Strict foreign key constraints and relationships
-- 4. Automatic triggers (timestamps, order numbers, auto-fill org/supplier IDs)
-- 5. Strict RLS policies enforcing multi-tenant isolation
-- 6. Sample data and auto-linking for existing users
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_timestamp() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_order_number() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- CLEANUP EXISTING TABLES
-- ============================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_new_user() CASCADE;

DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS supplier_products CASCADE;
DROP TABLE IF EXISTS driver_assignments CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- ============================================================
-- 1. ORGANIZATIONS (Multi-Tenant Root)
-- ============================================================
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  address text,
  phone text,
  email text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_org_slug ON organizations(slug);

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid UNIQUE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
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
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- 3. USER ROLES (Kept for backward compatibility with app auth)
-- ============================================================
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  organization_name text,
  role text NOT NULL DEFAULT 'inventory manager',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_role_check CHECK (role IN ('admin', 'supplier', 'transporter', 'inventory manager')),
  UNIQUE(user_id)
);
CREATE INDEX idx_ur_org ON user_roles(organization_id);

-- ============================================================
-- 4. SUPPLIERS
-- ============================================================
CREATE TABLE suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sup_org ON suppliers(organization_id);
CREATE INDEX idx_sup_user ON suppliers(user_id);

-- ============================================================
-- 5. CATEGORIES
-- ============================================================
-- Categories now belong to both org and supplier (Not global)
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cat_org ON categories(organization_id);
CREATE INDEX idx_cat_sup ON categories(supplier_id);

-- ============================================================
-- 6. PRODUCTS
-- ============================================================
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  sku text,
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  min_stock_level integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_prod_org ON products(organization_id);
CREATE INDEX idx_prod_sup ON products(supplier_id);
CREATE INDEX idx_prod_cat ON products(category_id);

-- ============================================================
-- 7. ORDERS
-- ============================================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL DEFAULT '',
  
  -- Core Relations
  user_id uuid REFERENCES users(id) ON DELETE SET NULL, -- Maps to Manager ID
  supplier_id uuid REFERENCES suppliers(id) ON DELETE RESTRICT,
  
  -- Workflow Statuses
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected','preparing','ready_for_delivery','out_for_delivery','delivered','cancelled')),
  
  -- Transporter Extensibility
  transporter_id uuid REFERENCES users(id) ON DELETE SET NULL,
  delivery_status text DEFAULT 'not_assigned' CHECK (delivery_status IN ('not_assigned', 'in_transit', 'delivered')),
  
  -- Legacy App Fields
  product_name text,
  supplier_name text,
  category text,
  custom_product_id text,
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  delivery_address text,
  customer_name text,
  customer_email text,
  customer_phone text,
  notes text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TRIGGER trg_order_number BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION generate_order_number();
CREATE INDEX idx_ord_org ON orders(organization_id);
CREATE INDEX idx_ord_sup ON orders(supplier_id);
CREATE INDEX idx_ord_mgr ON orders(user_id);
CREATE INDEX idx_ord_trans ON orders(transporter_id);

-- ============================================================
-- 8. ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE RESTRICT,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0), -- Represents price_at_time
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_oi_ord ON order_items(order_id);
CREATE INDEX idx_oi_prod ON order_items(product_id);

-- Other Application Tables (Stock, Notifications) included for compatibility
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  movement_type text NOT NULL,
  quantity integer NOT NULL,
  stock_before integer NOT NULL,
  stock_after integer NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'system',
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGERS (TIMESTAMPS & AUTO-FILL)
-- ============================================================
CREATE TRIGGER ts_organizations BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER ts_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER ts_user_roles BEFORE UPDATE ON user_roles FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER ts_categories BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER ts_suppliers BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER ts_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER ts_orders BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();
CREATE TRIGGER ts_order_items BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Auto-fill organization_id so client-side code doesn't break
CREATE OR REPLACE FUNCTION auto_fill_org_id() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := (SELECT organization_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_org_cat BEFORE INSERT ON categories FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();
CREATE TRIGGER auto_org_prod BEFORE INSERT ON products FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();
CREATE TRIGGER auto_org_ord BEFORE INSERT ON orders FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();
CREATE TRIGGER auto_org_sup BEFORE INSERT ON suppliers FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();
CREATE TRIGGER auto_org_sm BEFORE INSERT ON stock_movements FOR EACH ROW EXECUTE FUNCTION auto_fill_org_id();

-- Auto-fill supplier_id for products and categories created by a supplier
CREATE OR REPLACE FUNCTION auto_fill_supplier_id() RETURNS TRIGGER AS $$
DECLARE
  v_role text;
  v_supplier_id uuid;
BEGIN
  v_role := (SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1);
  IF v_role = 'supplier' THEN
    v_supplier_id := (SELECT s.id FROM suppliers s JOIN users u ON s.user_id = u.id WHERE u.auth_user_id = auth.uid() LIMIT 1);
    IF v_supplier_id IS NOT NULL THEN
      NEW.supplier_id := v_supplier_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_sup_prod BEFORE INSERT OR UPDATE ON products FOR EACH ROW EXECUTE FUNCTION auto_fill_supplier_id();
CREATE TRIGGER auto_sup_cat BEFORE INSERT OR UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION auto_fill_supplier_id();

-- Auto-create a supplier profile when a new supplier user is added
CREATE OR REPLACE FUNCTION auto_create_supplier_profile() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'supplier' THEN
    INSERT INTO suppliers (organization_id, user_id, name, contact_email)
    VALUES (NEW.organization_id, NEW.id, NEW.name, NEW.email)
    -- Prevent failure if a profile somehow already exists
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER auto_create_supplier AFTER INSERT OR UPDATE ON users FOR EACH ROW EXECUTE FUNCTION auto_create_supplier_profile();

-- ============================================================
-- ROW LEVEL SECURITY (STRICT ISOLATION)
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Helper Functions for RLS
CREATE OR REPLACE FUNCTION get_current_org_id() RETURNS uuid AS $$
  SELECT organization_id FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_role() RETURNS text AS $$
  SELECT role FROM user_roles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_supplier_id() RETURNS uuid AS $$
  SELECT s.id FROM suppliers s JOIN users u ON s.user_id = u.id WHERE u.auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- SERVICE ROLE BYPASS
CREATE POLICY "srv_org" ON organizations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_ur" ON user_roles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_cat" ON categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_sup" ON suppliers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_prod" ON products FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_ord" ON orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "srv_oi" ON order_items FOR ALL USING (auth.role() = 'service_role');

-- TENANT ISOLATION (Base View Policies)
CREATE POLICY "org_view_org" ON organizations FOR SELECT USING (id = get_current_org_id());
CREATE POLICY "org_view_users" ON users FOR SELECT USING (organization_id = get_current_org_id());
CREATE POLICY "org_view_ur" ON user_roles FOR SELECT USING (organization_id = get_current_org_id());
CREATE POLICY "org_view_sup" ON suppliers FOR SELECT USING (organization_id = get_current_org_id());
CREATE POLICY "org_view_cat" ON categories FOR SELECT USING (organization_id = get_current_org_id());
CREATE POLICY "org_view_prod" ON products FOR SELECT USING (organization_id = get_current_org_id());
CREATE POLICY "org_view_ord" ON orders FOR SELECT USING (organization_id = get_current_org_id());
CREATE POLICY "org_view_oi" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND organization_id = get_current_org_id())
);

-- STRICT WRITE POLICIES BY ROLE

-- Admin: Can manage everything in their org
CREATE POLICY "admin_all_users" ON users FOR ALL USING (get_current_role() = 'admin' AND organization_id = get_current_org_id());
CREATE POLICY "admin_all_cat" ON categories FOR ALL USING (get_current_role() = 'admin' AND organization_id = get_current_org_id());
CREATE POLICY "admin_all_sup" ON suppliers FOR ALL USING (get_current_role() = 'admin' AND organization_id = get_current_org_id());
CREATE POLICY "admin_all_prod" ON products FOR ALL USING (get_current_role() = 'admin' AND organization_id = get_current_org_id());
CREATE POLICY "admin_all_ord" ON orders FOR ALL USING (get_current_role() = 'admin' AND organization_id = get_current_org_id());

-- Supplier: Can only manage categories/products belonging to their supplier_id
CREATE POLICY "supplier_manage_cat" ON categories FOR ALL 
USING (get_current_role() = 'supplier' AND organization_id = get_current_org_id() AND supplier_id = get_current_supplier_id());

CREATE POLICY "supplier_manage_prod" ON products FOR ALL 
USING (get_current_role() = 'supplier' AND organization_id = get_current_org_id() AND supplier_id = get_current_supplier_id());

CREATE POLICY "supplier_update_orders" ON orders FOR UPDATE 
USING (get_current_role() = 'supplier' AND organization_id = get_current_org_id() AND supplier_id = get_current_supplier_id());

-- Manager (inventory manager): Can create categories/products, and create orders
CREATE POLICY "mgr_manage_cat" ON categories FOR ALL USING (get_current_role() = 'inventory manager' AND organization_id = get_current_org_id());
CREATE POLICY "mgr_manage_prod" ON products FOR ALL USING (get_current_role() = 'inventory manager' AND organization_id = get_current_org_id());
CREATE POLICY "mgr_insert_orders" ON orders FOR INSERT WITH CHECK (get_current_role() = 'inventory manager' AND organization_id = get_current_org_id());
CREATE POLICY "mgr_update_orders" ON orders FOR UPDATE USING (get_current_role() = 'inventory manager' AND organization_id = get_current_org_id());
CREATE POLICY "mgr_manage_oi" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM orders WHERE id = order_items.order_id AND organization_id = get_current_org_id())
);


-- ============================================================
-- SAMPLE DATA & AUTO-LINKING
-- ============================================================
-- 1. Create Demo Org
INSERT INTO organizations (id, name, slug, address, phone, email) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'GoGodam Demo Org', 'gogodam-demo', 'Kathmandu, Nepal', '+977-1234567890', 'demo@gogodam.com')
  ON CONFLICT DO NOTHING;

-- 2. Auto-Link Existing Auth Users
INSERT INTO users (auth_user_id, organization_id, name, email, role)
SELECT au.id, 'a0000000-0000-0000-0000-000000000001', COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)), au.email,
  CASE
    WHEN au.email ILIKE '%admin%' THEN 'admin'
    WHEN au.email ILIKE '%supplier%' THEN 'supplier'
    WHEN au.email ILIKE '%transport%' THEN 'transporter'
    ELSE 'inventory manager'
  END
FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.auth_user_id = au.id) ON CONFLICT (auth_user_id) DO NOTHING;

INSERT INTO user_roles (user_id, organization_id, role)
SELECT au.id, 'a0000000-0000-0000-0000-000000000001',
  CASE
    WHEN au.email ILIKE '%admin%' THEN 'admin'
    WHEN au.email ILIKE '%supplier%' THEN 'supplier'
    WHEN au.email ILIKE '%transport%' THEN 'transporter'
    ELSE 'inventory manager'
  END
FROM auth.users au WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = au.id) ON CONFLICT (user_id) DO NOTHING;

-- 3. Create Demo Suppliers linked to Supplier Users
INSERT INTO suppliers (organization_id, name, contact_email) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'TechCorp Supplies', 'tech@supplier.com'),
  ('a0000000-0000-0000-0000-000000000001', 'Fresh Foods Ltd', 'fresh@supplier.com');

UPDATE suppliers s SET user_id = u.id FROM users u 
WHERE u.role = 'supplier' AND u.organization_id = s.organization_id AND s.user_id IS NULL AND u.email ILIKE '%supplier%';

-- 4. Demo Categories (Assigned to TechCorp)
INSERT INTO categories (organization_id, supplier_id, name, description)
SELECT 'a0000000-0000-0000-0000-000000000001', id, 'Electronics', 'Electronic devices' FROM suppliers WHERE name = 'TechCorp Supplies' LIMIT 1;

-- 5. Demo Products (Assigned to TechCorp)
INSERT INTO products (organization_id, supplier_id, category_id, name, price, stock)
SELECT 'a0000000-0000-0000-0000-000000000001', s.id, c.id, 'Wireless Headphones', 199.99, 50 
FROM suppliers s JOIN categories c ON c.supplier_id = s.id 
WHERE s.name = 'TechCorp Supplies' AND c.name = 'Electronics' LIMIT 1;
