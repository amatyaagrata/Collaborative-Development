# Product Module

This folder contains the UI implementation for managing products in the GoGodam Inventory Management System.

## Current Status: Frontend UI (Static CRUD)
A fully functional Product page has been built matching the exact design specifications provided.

### List View
- **Toolbar:** Search bar (rounded, with search icon), Filter button (outlined purple pill), and "Add now" button (filled purple pill).
- **Table:** Displays columns for Product, Product Id, Category, Price, Stock, and Action (Edit/Delete icons).
- **Checkboxes:** Row-level selection checkboxes matching the design.
- **Search:** Client-side filtering by product name, ID, or category.

### Form View (Add / Edit)
- **Two-Column Layout:** Fields are arranged in a responsive 2-column grid:
  - Row 1: Product Name + Product ID
  - Row 2: Category + Price
  - Row 3: Product Quantity + Stock Alert
- **Details:** Full-width textarea for product descriptions.
- **Upload Images:** Placeholder drop area for future file upload integration.
- **Actions:** Cancel and Save buttons aligned to the right.

### State Management
- All CRUD operations (Create, Read, Update, Delete) are handled via React `useState`.
- Dummy data is pre-loaded on mount.

## Future Plans: Backend & Database Integration
The application will use **Node.js + Express** backend connected to **Supabase** (PostgreSQL).

### How Management Will Change:
1. **Replacing State with API Calls:**
   - The current functions have `// TODO` comments marking where API calls will go:
     - `addProduct` → `POST /api/products`
     - `updateProduct` → `PUT /api/products/:id`
     - `deleteProduct` → `DELETE /api/products/:id`
   - A `useEffect` hook will replace the static `initialProducts` array with a `GET /api/products` fetch on mount.

2. **Supabase Table Structure:**
   - A `products` table: `id`, `name`, `product_id`, `category_id` (FK to categories), `price`, `stock`, `stock_alert`, `details`, `image_url`, `created_at`.

3. **Category Dropdown:**
   - The Category field will become a dynamic `<select>` populated from the categories API (`GET /api/categories`).

4. **Image Uploads:**
   - The upload area will connect to **Supabase Storage** via the Express backend, storing the returned public URL in the product record.

5. **Search & Filter:**
   - Search will transition to server-side queries for performance at scale.
   - The Filter button will open advanced filtering options (by category, price range, stock levels).
