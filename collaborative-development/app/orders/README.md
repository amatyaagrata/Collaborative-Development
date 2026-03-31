# Orders Module

This folder contains the UI implementation for managing orders in the GoGodam Inventory Management System.

## Current Status: Frontend UI (Static CRUD)
A fully functional Orders page has been built matching the exact design specifications provided, with consistent styling and functionality as the Product module.

### List View
- **Toolbar:** Search bar (rounded, with search icon) and "Add New Order" button (filled purple pill with plus icon).
- **Table:** Displays columns for Product, Suppliers, Product Id, Category, Price, Quantity, and Action (Edit/Delete icons).
- **Checkboxes:** Row-level selection checkboxes matching the design for bulk operations.
- **Search:** Client-side filtering by product name, supplier name, product ID, or category.
- **Quantity Badges:** Visual indicators for high/low stock levels:
  - High quantity (>50): Green badge
  - Low quantity (≤50): Orange badge

### Form View (Add / Edit)
- **Two-Column Layout:** Fields are arranged in a responsive 2-column grid:
  - Row 1: Product Name (required) + Suppliers
  - Row 2: Product ID + Category (required)
  - Row 3: Price + Quantity
- **Form Validation:**
  - Required fields: Product Name and Category
  - Price and Quantity validation for numeric values
  - Toast notifications for success/error messages
- **Actions:** Cancel and Save buttons aligned to the right with hover effects.

### CRUD Operations
- **Add Order:** Form collects order details, generates unique ID, and adds to the list.
- **Edit Order:** Click pencil icon to open pre-filled form, update order details.
- **Delete Order:** Click trash icon with confirmation dialog, removes from list.
- **State Management:** All CRUD operations handled via React `useState` with dummy data.

### Styling & Responsiveness
- **CSS Module:** `orders.css` provides consistent styling matching the Product module.
- **Responsive Design:** 
  - Desktop: 2-column form layout
  - Mobile: 1-column stacked layout with responsive table scrolling
- **Hover Effects:** Interactive elements have smooth transitions and scale effects.

## Database Schema (Planned)

### Orders Table Structure (Supabase/PostgreSQL)

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name VARCHAR(255),
  category_id UUID REFERENCES categories(id),
  category_name VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_amount DECIMAL(10,2) GENERATED ALWAYS AS (price * quantity) STORED,
  status VARCHAR(50) DEFAULT 'pending',
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_delivery DATE,
  actual_delivery DATE,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_supplier_id ON orders(supplier_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_order_date ON orders(order_date);