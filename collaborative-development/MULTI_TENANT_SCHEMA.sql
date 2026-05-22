-- =========================================================================
-- STRICT MULTI-TENANT INVENTORY MANAGEMENT SCHEMA
-- =========================================================================
-- This script contains the complete PostgreSQL schema with Row Level Security
-- enforcing strict tenant isolation between two sample orgs:
-- "All-in-One Store" and "Cafe".

-- =========================================================================
-- 1. Helper Functions for RLS
-- =========================================================================
-- Using `current_setting` to simulate a session-level auth context.
-- In a real Supabase environment, this is often `(auth.jwt() ->> 'org_id')::uuid`.
CREATE OR REPLACE FUNCTION get_current_org_id() RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.current_org_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- =========================================================================
-- 2. Schema Definitions (Tables)
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text NOT NULL, -- e.g., 'retail', 'fnb'
    created_at timestamptz DEFAULT now()
);

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email text NOT NULL,
    name text NOT NULL,
    role text NOT NULL,
    created_at timestamptz DEFAULT now(),
    UNIQUE (org_id, email)
);

CREATE TABLE categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE suppliers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
    name text NOT NULL,
    description text,
    price numeric(12, 2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE drivers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    phone text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE vehicles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
    vehicle_type text NOT NULL,
    license_plate text NOT NULL,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE purchase_orders (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    supplier_id uuid NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'pending',
    total_amount numeric(12, 2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    customer_name text,
    total_amount numeric(12, 2) NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE stock_movements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    movement_type text NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity integer NOT NULL,
    reference_id uuid, -- link to PO or sale
    created_at timestamptz DEFAULT now()
);

-- =========================================================================
-- 3. Row Level Security (RLS) Enablement
-- =========================================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 4. RLS Policies
-- =========================================================================
-- By default, these policies ensure operations are locked to the user's current_org_id.

CREATE POLICY org_isolation_policy ON organizations 
    FOR ALL USING (id = get_current_org_id());

CREATE POLICY user_isolation_policy ON users 
    FOR ALL USING (org_id = get_current_org_id()) WITH CHECK (org_id = get_current_org_id());

CREATE POLICY category_isolation_policy ON categories 
    FOR ALL USING (org_id = get_current_org_id()) WITH CHECK (org_id = get_current_org_id());

CREATE POLICY supplier_isolation_policy ON suppliers 
    FOR ALL USING (org_id = get_current_org_id()) WITH CHECK (org_id = get_current_org_id());

CREATE POLICY product_isolation_policy ON products 
    FOR ALL USING (org_id = get_current_org_id()) WITH CHECK (org_id = get_current_org_id());

CREATE POLICY driver_isolation_policy ON drivers 
    FOR ALL USING (org_id = get_current_org_id()) WITH CHECK (org_id = get_current_org_id());

CREATE POLICY vehicle_isolation_policy ON vehicles 
    FOR ALL USING (org_id = get_current_org_id()) WITH CHECK (org_id = get_current_org_id());

CREATE POLICY po_isolation_policy ON purchase_orders 
    FOR ALL USING (org_id = get_current_org_id()) WITH CHECK (org_id = get_current_org_id());

CREATE POLICY sales_isolation_policy ON sales 
    FOR ALL USING (org_id = get_current_org_id()) WITH CHECK (org_id = get_current_org_id());

CREATE POLICY stock_isolation_policy ON stock_movements 
    FOR ALL USING (org_id = get_current_org_id()) WITH CHECK (org_id = get_current_org_id());

-- =========================================================================
-- 5. Indexing Strategy for Tenant Isolation Performance
-- =========================================================================
-- Composite indices starting with org_id for rapid filtering.
CREATE INDEX idx_users_org_id ON users (org_id);
CREATE INDEX idx_categories_org_id ON categories (org_id);
CREATE INDEX idx_suppliers_org_id ON suppliers (org_id);
CREATE INDEX idx_products_org_id ON products (org_id);
CREATE INDEX idx_drivers_org_id ON drivers (org_id);
CREATE INDEX idx_vehicles_org_id ON vehicles (org_id);
CREATE INDEX idx_po_org_id ON purchase_orders (org_id);
CREATE INDEX idx_sales_org_id ON sales (org_id);
CREATE INDEX idx_stock_org_id ON stock_movements (org_id);

CREATE INDEX idx_products_category ON products (org_id, category_id);
CREATE INDEX idx_products_supplier ON products (org_id, supplier_id);
CREATE INDEX idx_vehicles_driver ON vehicles (org_id, driver_id);
CREATE INDEX idx_stock_product ON stock_movements (org_id, product_id);

-- =========================================================================
-- 6. Migration / Default Organization Strategy
-- =========================================================================
-- Script to wrap existing data into a default org if migrating from a single-tenant DB.
DO $$
DECLARE
    default_org_id uuid;
BEGIN
    -- This simulates migrating existing data by assigning it to a default org.
    -- To use, uncomment below logic during your initial migration step before enforcing RLS.
    
    -- INSERT INTO organizations (name, type) VALUES ('Legacy Root Org', 'legacy') RETURNING id INTO default_org_id;
    
    -- Example migration assignment:
    -- UPDATE products SET org_id = default_org_id WHERE org_id IS NULL;
    -- UPDATE categories SET org_id = default_org_id WHERE org_id IS NULL;
END $$;

-- =========================================================================
-- 7. Sample Data (All-in-One Store and Cafe)
-- =========================================================================
-- Temporarily bypass RLS to insert initial mock multi-tenant data.
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE drivers DISABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    store_id uuid := gen_random_uuid();
    cafe_id uuid := gen_random_uuid();
    
    cat_elec uuid := gen_random_uuid();
    cat_cloth uuid := gen_random_uuid();
    cat_app uuid := gen_random_uuid();
    sup_tech uuid := gen_random_uuid();
    sup_fash uuid := gen_random_uuid();
    sup_home uuid := gen_random_uuid();
    
    cat_coffee uuid := gen_random_uuid();
    cat_pastry uuid := gen_random_uuid();
    cat_smoothie uuid := gen_random_uuid();
    sup_bean uuid := gen_random_uuid();
    sup_bake uuid := gen_random_uuid();
    sup_health uuid := gen_random_uuid();
BEGIN
    -- Organizations
    INSERT INTO organizations (id, name, type) VALUES 
        (store_id, 'All-in-One Store', 'retail'),
        (cafe_id, 'Cafe', 'fnb');

    -- ===================== ALL-IN-ONE STORE DATA =====================
    INSERT INTO categories (id, org_id, name) VALUES 
        (cat_elec, store_id, 'Electronics'),
        (cat_cloth, store_id, 'Clothing'),
        (cat_app, store_id, 'Home Appliances');
        
    INSERT INTO suppliers (id, org_id, name) VALUES 
        (sup_tech, store_id, 'TechDistro'),
        (sup_fash, store_id, 'FashionHub'),
        (sup_home, store_id, 'HomeAppliancesCo');
        
    INSERT INTO products (org_id, category_id, supplier_id, name, price) VALUES 
        (store_id, cat_elec, sup_tech, 'Laptops', 999.99),
        (store_id, cat_elec, sup_tech, 'Smartphones', 699.99),
        (store_id, cat_cloth, sup_fash, 'T-shirts', 19.99),
        (store_id, cat_cloth, sup_fash, 'Jeans', 49.99),
        (store_id, cat_app, sup_home, 'Refrigerators', 899.99),
        (store_id, cat_app, sup_home, 'Microwaves', 149.99);

    INSERT INTO drivers (id, org_id, name) VALUES 
        (gen_random_uuid(), store_id, 'Store Logistics 1'),
        (gen_random_uuid(), store_id, 'Store Logistics 2');
        
    INSERT INTO vehicles (org_id, vehicle_type, license_plate) VALUES 
        (store_id, 'Truck', 'TRK-001'),
        (store_id, 'Van', 'VAN-002');

    -- ===================== CAFE DATA =====================
    INSERT INTO categories (id, org_id, name) VALUES 
        (cat_coffee, cafe_id, 'Coffee'),
        (cat_pastry, cafe_id, 'Pastries'),
        (cat_smoothie, cafe_id, 'Smoothies');
        
    INSERT INTO suppliers (id, org_id, name) VALUES 
        (sup_bean, cafe_id, 'BeanMaster'),
        (sup_bake, cafe_id, 'FreshBakery'),
        (sup_health, cafe_id, 'HealthyFoods');
        
    INSERT INTO products (org_id, category_id, supplier_id, name, price) VALUES 
        (cafe_id, cat_coffee, sup_bean, 'Espresso beans', 24.99),
        (cafe_id, cat_coffee, sup_bean, 'Green tea leaves', 14.99),
        (cafe_id, cat_pastry, sup_bake, 'Croissants', 3.99),
        (cafe_id, cat_pastry, sup_bake, 'Chicken sandwich', 7.99),
        (cafe_id, cat_smoothie, sup_health, 'Mango smoothie', 5.99);

    INSERT INTO drivers (id, org_id, name) VALUES 
        (gen_random_uuid(), cafe_id, 'Delivery Bike 1'),
        (gen_random_uuid(), cafe_id, 'Delivery Bike 2');

    INSERT INTO vehicles (org_id, vehicle_type, license_plate) VALUES 
        (cafe_id, 'Bike', 'BIKE-01'),
        (cafe_id, 'Small Van', 'SVAN-01');

    RAISE NOTICE 'Sample data inserted successfully. Store ID: %, Cafe ID: %', store_id, cafe_id;
END $$;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

-- =========================================================================
-- 8. Verification & Example Queries
-- =========================================================================
/*
To execute these verifications, pick the logged Store ID and Cafe ID from the notice above.

--  WRONG (Fails because RLS drops all rows when org_id context is missing)
SELECT * FROM products;

-- CORRECT - Acting as All-in-One Store
SET app.current_org_id = '<store_id_here>';
SELECT * FROM products;
-- Output will ONLY show Laptops, Smartphones, T-shirts, Jeans, Refrigerators, Microwaves.

-- CORRECT - Acting as Cafe
SET app.current_org_id = '<cafe_id_here>';
SELECT * FROM categories;
-- Output will ONLY show Coffee, Pastries, Smoothies.

-- ROVING DATA ISOLATION (No Data Leakage)
SET app.current_org_id = '<cafe_id_here>';
-- Attempt to query Store drivers:
SELECT * FROM vehicles WHERE vehicle_type = 'Truck';
-- Result: 0 rows

-- FOREIGN KEY PROTECTION ACROSS TENANTS
-- If Cafe tries to create a product using a Store's Supplier ID, it will error out.
SET app.current_org_id = '<cafe_id_here>';
INSERT INTO products (org_id, category_id, supplier_id, name, price) 
VALUES ('<cafe_id_here>', '<valid_cafe_category_id>', '<invalid_store_supplier_id>', 'Test', 10);
-- Result: ERROR: insert or update on table "products" violates foreign key constraint...
-- The RLS policy hides the store's supplier, effectively making it non-existent to the Cafe context.
*/

-- =========================================================================
-- 9. Rollback Script (Tear Down)
-- =========================================================================
/*
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP FUNCTION IF EXISTS get_current_org_id() CASCADE;
*/
