# Complete Signup Debugging & Fix Guide

## Prerequisites Checklist
- [ ] `.env.local` has `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] Dev server restarted after setting env vars
- [ ] Supabase project is accessible
- [ ] Database tables exist (users, user_roles)

## Step 1: Verify Database Tables Exist

1. Go to **Supabase Dashboard** → Your Project → **SQL Editor**
2. Run this query to verify tables exist:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('users', 'user_roles', 'auth.users');
```

**Expected output:** Should see `users`, `user_roles` tables listed

---

## Step 2: Check RLS Policies

In Supabase SQL Editor, run:

```sql
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename IN ('users', 'user_roles')
ORDER BY tablename, policyname;
```

**Expected:** Should show policies for `users` and `user_roles` including `service_role_all_users`, `service_role_all_user_roles`

If missing, run this to create clean policies:

```sql
-- Drop all old conflicting policies
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Users can update own role" ON user_roles;
DROP POLICY IF EXISTS "Service role can create roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can update roles" ON user_roles;
DROP POLICY IF EXISTS "Service role can manage user_roles" ON user_roles;
DROP POLICY IF EXISTS "service_role_all_users" ON users;
DROP POLICY IF EXISTS "service_role_all_user_roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Anyone can view categories" ON categories;
DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Anyone can view suppliers" ON suppliers;

-- Create clean, service-role-friendly policies
CREATE POLICY "service_role_all_users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all_user_roles" ON user_roles FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can view own role" ON user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own role" ON user_roles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view products" ON products FOR SELECT USING (true);
CREATE POLICY "Anyone can view suppliers" ON suppliers FOR SELECT USING (true);
```

---

## Step 3: Verify Environment Variables

1. Check `.env.local` file contains all three keys:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - ✅ `SUPABASE_SERVICE_ROLE_KEY` (server-side only, NOT in public key)

2. Service role key should start with `eyJ...` and contain `"role":"service_role"`

---

## Step 4: Test Signup with Console Logging

1. **Restart dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser DevTools** (F12) → Console tab

3. **Open another terminal tab and watch server logs:**
   ```bash
   # Keep this running during signup
   npm run dev
   ```

4. **Try signing up** with test credentials:
   - Email: `test@example.com`
   - Username: `testuser`
   - Organization: `Test Org`
   - Password: `testpass123`
   - Role: Select any role
   - Agree to terms

5. **Watch both console logs for [CLIENT] and [SIGNUP] messages**

---

## Step 5: Interpret Log Messages

### Expected Success Flow:
```
[CLIENT] Starting signup...
[CLIENT] Calling Supabase auth.signUp...
[CLIENT] Auth signup successful, user ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[CLIENT] Calling /api/auth/signup endpoint...
[SIGNUP] Request received
[SIGNUP] Body: { email: 'test@example.com', name: 'testuser', role: 'inventory manager' }
[SIGNUP] Creating admin client...
[SIGNUP] Admin client created successfully
[SIGNUP] Role normalized: { requested: 'inventory manager', normalized: 'inventory manager' }
[SIGNUP] Upserting user record...
[SIGNUP] User record created/updated: [...]
[SIGNUP] Upserting user_roles record...
[SIGNUP] User role record created/updated: [...]
[SIGNUP] Signup completed successfully
[CLIENT] API response status: 200
[CLIENT] Signup completed successfully
```

### Common Error Scenarios:

**Error: "SUPABASE_SERVICE_ROLE_KEY is missing"**
- Fix: Add to `.env.local` and restart dev server

**Error: "relation \"public.users\" does not exist"**
- Fix: Run `database-rebuild.sql` in Supabase SQL Editor

**Error: "new row violates row level security policy"**
- Fix: RLS policies not set correctly - run policies from Step 2

**Error: "duplicate key value violates unique constraint"**
- Fix: User already exists - use different email or delete from auth

---

## Step 6: Verify Data in Supabase

After successful signup, check if data was created:

```sql
-- Check users table
SELECT id, auth_user_id, email, name, role FROM users ORDER BY created_at DESC LIMIT 5;

-- Check user_roles table
SELECT id, user_id, role FROM user_roles ORDER BY created_at DESC LIMIT 5;

-- Check auth.users (Supabase auth table)
SELECT id, email FROM auth.users ORDER BY created_at DESC LIMIT 5;
```

---

## Step 7: Test Complete Flow

1. Sign up successfully
2. Check your email for verification link (in development, may not be sent)
3. Try logging in with same credentials
4. Should redirect to dashboard with user role

---

## Emergency Reset (if needed)

To completely reset and start fresh:

```sql
-- Delete all data but keep tables
DELETE FROM user_roles;
DELETE FROM users;

-- Or completely rebuild database:
-- Run database-rebuild.sql to drop and recreate all tables
```

---

## Still Having Issues?

Check these in order:
1. ✅ `.env.local` has all 3 environment variables
2. ✅ Dev server restarted after env changes
3. ✅ Database tables exist
4. ✅ RLS policies created (with `service_role_all_users` policy)
5. ✅ Service role key is correct (copy from Supabase Project Settings → API)
6. ✅ Check browser console for [CLIENT] logs
7. ✅ Check terminal for [SIGNUP] logs
