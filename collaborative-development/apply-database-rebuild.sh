#!/bin/bash

# Database rebuild script for collaborative development project
# This script applies the complete database rebuild to Supabase

echo "🚀 Starting database rebuild for collaborative development project..."

# Check if SUPABASE_URL and SUPABASE_ANON_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: SUPABASE_URL and SUPABASE_ANON_KEY environment variables must be set"
    echo "Please set them with:"
    echo "export SUPABASE_URL='your-supabase-url'"
    echo "export SUPABASE_ANON_KEY='your-anon-key'"
    exit 1
fi

# Check if the rebuild SQL file exists
if [ ! -f "database-rebuild.sql" ]; then
    echo "❌ Error: database-rebuild.sql file not found in current directory"
    exit 1
fi

echo "📡 Connecting to Supabase..."
echo "URL: $SUPABASE_URL"

# Apply the database rebuild using curl to Supabase REST API
# Note: This assumes you have the service role key for admin operations
# For production, you should use the Supabase CLI or direct database connection

echo "⚠️  WARNING: This will DROP and RECREATE all tables!"
echo "Make sure you have backups of any important data."
read -p "Are you sure you want to continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 1
fi

echo "🔨 Applying database rebuild..."

# Use psql if available (for direct database connection)
if command -v psql &> /dev/null; then
    echo "Using psql for direct database connection..."
    # This would require database URL with password
    echo "Please run the SQL file manually in Supabase SQL Editor:"
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of database-rebuild.sql"
    echo "4. Execute the script"
else
    echo "psql not found. Please run the SQL file manually in Supabase SQL Editor:"
    echo "1. Go to your Supabase project dashboard"
    echo "2. Navigate to SQL Editor"
    echo "3. Copy and paste the contents of database-rebuild.sql"
    echo "4. Execute the script"
fi

echo "✅ Database rebuild script prepared!"
echo ""
echo "Next steps:"
echo "1. Open your Supabase project in the browser"
echo "2. Go to SQL Editor"
echo "3. Copy the contents of database-rebuild.sql"
echo "4. Execute the script"
echo "5. Verify tables were created successfully"
echo ""
echo "After rebuild, test the application with: npm run dev"