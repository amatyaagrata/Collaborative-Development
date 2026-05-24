-- ============================================================
-- FIX: SUPPLIER PRODUCTS NOT SHOWING FOR INVENTORY MANAGER
-- Problem: Suppliers add products to 'supplier_products', but
-- the Inventory Manager dropdown fetches from 'products'.
--
-- Solution: We create a trigger that automatically syncs any 
-- product added by a supplier directly into the organization's
-- main 'products' table so it can be ordered. Handles duplicates!
-- ============================================================

CREATE OR REPLACE FUNCTION sync_supplier_product_to_products()
RETURNS TRIGGER AS $$
DECLARE
    v_category_id uuid;
BEGIN
    -- 1. Try to find an existing category with the same name, or use 'Supplied Items'
    SELECT id INTO v_category_id 
    FROM public.categories 
    WHERE org_id = NEW.org_id 
      AND name ILIKE COALESCE(NEW.category, 'Supplied Items') 
    LIMIT 1;

    -- 2. If no category found, auto-create it
    IF v_category_id IS NULL THEN
        INSERT INTO public.categories (org_id, name)
        VALUES (NEW.org_id, COALESCE(NEW.category, 'Supplied Items'))
        RETURNING id INTO v_category_id;
    END IF;

    -- 3. Sync into main products table
    IF TG_OP = 'INSERT' THEN
        -- Check if product with this SKU already exists
        IF NEW.sku IS NOT NULL AND EXISTS (SELECT 1 FROM public.products WHERE org_id = NEW.org_id AND sku = NEW.sku) THEN
            UPDATE public.products 
            SET supplier_id = NEW.supplier_id,
                selling_price = NEW.price
            WHERE org_id = NEW.org_id AND sku = NEW.sku;
        ELSE
            -- Otherwise try to insert safely
            BEGIN
                INSERT INTO public.products (
                    org_id,
                    category_id,
                    supplier_id,
                    name,
                    description,
                    selling_price,
                    current_stock,
                    sku
                ) VALUES (
                    NEW.org_id,
                    v_category_id,
                    NEW.supplier_id,
                    NEW.name,
                    'Auto-synced from supplier catalog',
                    NEW.price,
                    0, 
                    NEW.sku
                );
            EXCEPTION WHEN unique_violation THEN
                -- If it violates another unique constraint (like name), just link the supplier
                UPDATE public.products 
                SET supplier_id = NEW.supplier_id, selling_price = NEW.price
                WHERE org_id = NEW.org_id AND name = NEW.name;
            END;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        -- If supplier updates their catalog, update the main product
        UPDATE public.products 
        SET selling_price = NEW.price,
            sku = NEW.sku,
            category_id = v_category_id
        WHERE org_id = NEW.org_id AND (sku = NEW.sku OR (supplier_id = NEW.supplier_id AND name = NEW.name));
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Drop the trigger if it already exists to avoid errors
DROP TRIGGER IF EXISTS trigger_sync_supplier_product ON public.supplier_products;

-- 5. Create the trigger to fire whenever a supplier adds or updates a product
CREATE TRIGGER trigger_sync_supplier_product
AFTER INSERT OR UPDATE ON public.supplier_products
FOR EACH ROW
EXECUTE FUNCTION sync_supplier_product_to_products();

-- ============================================================
-- NOTE: To sync all existing supplier_products immediately
-- ============================================================
DO $$
DECLARE
    sp RECORD;
    v_category_id uuid;
BEGIN
    FOR sp IN SELECT * FROM public.supplier_products LOOP
        -- Get or create category
        SELECT id INTO v_category_id FROM public.categories 
        WHERE org_id = sp.org_id AND name ILIKE COALESCE(sp.category, 'Supplied Items') LIMIT 1;
        
        IF v_category_id IS NULL THEN
            INSERT INTO public.categories (org_id, name) VALUES (sp.org_id, COALESCE(sp.category, 'Supplied Items')) RETURNING id INTO v_category_id;
        END IF;

        -- Check if SKU already exists
        IF sp.sku IS NOT NULL AND EXISTS (SELECT 1 FROM public.products WHERE org_id = sp.org_id AND sku = sp.sku) THEN
            UPDATE public.products 
            SET supplier_id = sp.supplier_id, selling_price = sp.price
            WHERE org_id = sp.org_id AND sku = sp.sku;
        ELSIF NOT EXISTS (SELECT 1 FROM public.products WHERE org_id = sp.org_id AND name = sp.name) THEN
            BEGIN
                INSERT INTO public.products (org_id, category_id, supplier_id, name, description, selling_price, current_stock, sku)
                VALUES (sp.org_id, v_category_id, sp.supplier_id, sp.name, 'Auto-synced from supplier catalog', sp.price, 0, sp.sku);
            EXCEPTION WHEN unique_violation THEN
                -- Ignore if a unique constraint (like name) was violated
                UPDATE public.products 
                SET supplier_id = sp.supplier_id, selling_price = sp.price
                WHERE org_id = sp.org_id AND name = sp.name;
            END;
        END IF;
    END LOOP;
END $$;
