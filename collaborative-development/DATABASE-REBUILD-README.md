# Database Rebuild Guide

This guide covers the complete database rebuild process for the collaborative development project.

## Overview

The database rebuild creates a production-ready PostgreSQL schema with all necessary tables, relationships, constraints, and sample data for the collaborative development platform.

## Files

- `database-rebuild.sql` - Complete database schema and sample data
- `apply-database-rebuild.sh` - Helper script for applying the rebuild
- `production-schema.sql` - Original schema file (kept for reference)

## Database Schema

The rebuild creates the following tables:

### Core Tables
- `users` - Application users (separate from auth.users)
- `user_roles` - Role-based access control
- `organizations` - Organization/company records

### Business Tables
- `categories` - Product categories
- `suppliers` - Supplier information
- `products` - Product catalog with inventory
- `orders` - Order master records
- `order_items` - Order line items (normalized)
- `deliveries` - Delivery tracking
- `driver_assignments` - Driver/trip assignments
- `notifications` - User notifications

## Key Features

- **UUID Primary Keys** - All tables use UUID for scalability
- **Foreign Key Relationships** - Proper referential integrity
- **Automatic Timestamps** - Created/updated timestamps with triggers
- **Check Constraints** - Data validation at database level
- **Indexes** - Optimized queries on commonly filtered fields
- **Automatic User Creation** - Database trigger creates user records on signup
- **Row Level Security** - Proper access control policies
- **Sample Data** - Pre-populated test data for development

## How to Apply the Rebuild

### Method 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the entire contents of `database-rebuild.sql`
4. Paste into the SQL Editor
5. Click **Run** to execute

### Method 2: Using the Helper Script

```bash
# Set your Supabase credentials
export SUPABASE_URL="your-project-url"
export SUPABASE_ANON_KEY="your-anon-key"

# Run the rebuild script
./apply-database-rebuild.sh
```

**Note:** The helper script will guide you through the process and provide manual instructions.

## What the Rebuild Does

1. **Drops existing tables** (if they exist) in safe dependency order
2. **Creates all tables** with proper constraints and relationships
3. **Adds indexes** for performance optimization
4. **Creates triggers** for automatic timestamp updates and user creation
5. **Sets up Row Level Security** policies for proper access control
6. **Inserts sample data** for testing and development

## Sample Data Included

- 5 product categories (Electronics, Clothing, Food, Home, Books)
- 5 suppliers with contact information
- 5 sample products with inventory
- 3 sample organizations

## After Rebuild

1. **Verify tables created:**
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

2. **Check sample data:**
   ```sql
   SELECT COUNT(*) as products FROM products;
   SELECT COUNT(*) as suppliers FROM suppliers;
   SELECT COUNT(*) as categories FROM categories;
   ```

3. **Test the application:**
   ```bash
   npm run dev
   ```

## Important Changes

- **Organization Application System Removed**: The `organization_applications` table and related approval workflow have been completely removed. Users can now sign up directly without requiring admin approval.
- **Simplified Signup Flow**: Users can create accounts immediately with any organization name.

- ⚠️ **This will delete all existing data** - backup important data first
- 🔐 **Row Level Security** - Configure RLS policies after rebuild
- 🔄 **Real-time** - Enable real-time subscriptions for live updates
- 🧪 **Testing** - Test all CRUD operations after rebuild

## Troubleshooting

### Common Issues

1. **Permission denied** - Use service role key for admin operations
2. **Extension not available** - Ensure `pgcrypto` extension is enabled
3. **Foreign key errors** - Tables are created in dependency order

### Verification Queries

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Check constraints
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint WHERE conrelid::regclass::text LIKE 'public.%'
ORDER BY conrelid::regclass::text, contype;

-- Check indexes
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public' ORDER BY tablename;
```

## Next Steps

After successful rebuild:

1. Configure Row Level Security policies
2. Set up real-time subscriptions
3. Test user authentication flows
4. Verify all application features work
5. Add production data as needed

## Support

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Verify SQL syntax in the rebuild script
3. Ensure proper permissions for your user
4. Test with a fresh Supabase project if needed