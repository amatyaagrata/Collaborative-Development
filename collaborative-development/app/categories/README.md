# Categories Module

This folder contains the UI implementation for managing inventory categories in the GoGodam system.

## Current Status: Frontend UI (Static CRUD)
We have built a fully functional frontend Categories page that mirrors the premium design requirements.
- **List View:** Displays a styled table with inline Action buttons (Edit/Delete).
- **Form View:** A dynamic, conditionally rendered form layout with distinct branding (blue active borders, purple labels) for adding or editing a category.
- **State Management:** Currently manages Create, Read, Update, and Delete operations purely in the client state using React's `useState`. Dummy data is populated on load.
- **Assets:** Fully responsive CSS written in `categories.css` to align with the Dashboard themes. Built-in placeholder for an "Upload Images" drop-area.

## Future Plans: Backend & Database Integration
When the **Node.js + Express** server and **Supabase** database are ready, this module will transition from static state management to persistent database interactions.

### How Management Will Change:
1. **Replacing Hooks with API Calls:**
   - The current `addCategory()`, `updateCategory()`, and `deleteCategory()` functions in `page.tsx` have `// TODO` comments. These blocks will be replaced with standard `fetch` or `axios` calls pointing to your Node backend.
   - Example mapping:
     - `addCategory` ➡️ `POST /api/categories`
     - `updateCategory` ➡️ `PUT /api/categories/:id`
     - `deleteCategory` ➡️ `DELETE /api/categories/:id`
2. **Supabase Structure:**
   - A `Categories` table will be required in Supabase with columns: `id`, `name`, `description`, `status` (boolean or enum), and `created_at`.
3. **Handling File Uploads:**
   - The "Upload Images" UI component will need to be hooked up to **Supabase Storage**. You will upload the image file to a Supabase bucket via Node.js first, retrieve the public URL, and store that URL string in the `Categories` database row.
4. **Loading States:**
   - As we move to network requests, we will introduce `isLoading` states (e.g., locking the "Save" button with a spinner) while the UI waits for the Express backend to confirm database insertion.
