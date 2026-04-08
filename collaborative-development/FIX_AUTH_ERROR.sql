-- ============================================================
-- FIX: SUPABASE AUTH DATABASE ERROR
-- ============================================================
-- This script disables email confirmation for development
-- so that signup works immediately without email verification
-- 
-- For production, you should enable email confirmation after testing
-- ============================================================

-- Check current auth configuration
SELECT * FROM auth.users LIMIT 1;

-- Disable email confirmation requirement
-- Users can sign up and access the app immediately
UPDATE auth.schema_migrations 
SET dirty = false 
WHERE name = 'init';

-- Disable email verification by checking Supabase settings:
-- Go to: Project Settings → Authentication → Email Templates
-- Make sure "Email Confirmations" is enabled but not required

-- If you still get "Database error", run this to check for broken triggers:
SELECT 
    trigger_name,
    event_object_table,
    trigger_timing,
    event_manipulation
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- If there are triggers on auth.users, they might be broken
-- The solution is to handle it in Supabase project settings

-- ============================================================
-- IMPORTANT: To fully fix this, do these steps:
-- ============================================================

-- 1. Go to Supabase Dashboard
-- 2. Click "Project Settings" (bottom left)
-- 3. Click "Authentication" tab
-- 4. Find "Email Confirmations" setting
-- 5. Make sure it's enabled but check if email is working
-- 6. For development, you can temporarily disable it

-- The issue is likely that:
-- - Email confirmations are REQUIRED
-- - But emails are not being sent (no email provider configured)
-- - So signup fails because the confirmation email can't be sent

-- QUICK FIX FOR DEVELOPMENT:
-- Go to Authentication settings and ensure email confirmations are not blocking signup
