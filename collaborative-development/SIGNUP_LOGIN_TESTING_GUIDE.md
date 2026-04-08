# Complete Signup & Login Testing Guide

## Prerequisites

### Step 1: Run the Database Setup SQL

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Click **"New Query"**
3. Copy & paste the entire contents of `COMPLETE_DATABASE_SETUP.sql`
4. Click **"Execute"**
5. Wait for completion (should say "Database rebuild completed successfully")

### Step 2: Verify Environment Variables

Check `.env.local` has all three:
```
NEXT_PUBLIC_SUPABASE_URL=https://hgktngngjpsvkotukxwv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna3RuZ25nanBzdmtvdHVreHd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIs...
```

### Step 3: Restart Dev Server

```bash
# Stop current server (Ctrl+C if running)
npm run dev
```

---

## Testing Signup & Login with Different Roles

### Test 1: Signup as Admin

1. Go to **http://localhost:3000/signup**
2. Fill form:
   - Email: `admin@test.com`
   - Username: `admin_user`
   - Organization: `Admin Corp`
   - Password: `test1234`
   - Confirm Password: `test1234`
   - **Role: Select "Admin"**
   - Check "Agree to Terms"
3. Click **"Sign Up"**
4. **Expected Results:**
   - Toast: "Account created as admin!"
   - Console logs `[CLIENT] Signup completed successfully with role: admin`
   - Redirected to `/login`

5. Login with same credentials:
   - Email: `admin@test.com`
   - Password: `test1234`
   - Click **"Sign In"**

6. **Expected Results:**
   - Toast: "Welcome back! You are logged in as admin"
   - Console logs `[LOGIN] User role: admin Redirecting to: /admin/dashboard`
   - Redirected to **`/admin/dashboard`**

---

### Test 2: Signup as Supplier

1. Go to **http://localhost:3000/signup**
2. Fill form:
   - Email: `supplier@test.com`
   - Username: `supplier_user`
   - Organization: `Supplier Inc`
   - Password: `test1234`
   - Confirm Password: `test1234`
   - **Role: Select "Supplier"**
   - Check "Agree to Terms"
3. Click **"Sign Up"**
4. **Expected Results:**
   - Toast: "Account created as supplier!"
   - Redirected to `/login`

5. Login with same credentials:
   - Email: `supplier@test.com`
   - Password: `test1234`

6. **Expected Results:**
   - Toast: "Welcome back! You are logged in as supplier"
   - Redirected to **`/suppliers/dashboard`**

---

### Test 3: Signup as Transporter

1. Go to **http://localhost:3000/signup**
2. Fill form:
   - Email: `transporter@test.com`
   - Username: `transporter_user`
   - Organization: `Transport Co`
   - Password: `test1234`
   - Confirm Password: `test1234`
   - **Role: Select "Transporter"**
   - Check "Agree to Terms"
3. Click **"Sign Up"**
4. **Expected Results:**
   - Toast: "Account created as transporter!"
   - Redirected to `/login`

5. Login:
   - Email: `transporter@test.com`
   - Password: `test1234`

6. **Expected Results:**
   - Redirected to **`/driver/dashboard`**

---

### Test 4: Signup as Inventory Manager

1. Go to **http://localhost:3000/signup**
2. Fill form:
   - Email: `inventory@test.com`
   - Username: `inventory_user`
   - Organization: `Inventory Mgmt`
   - Password: `test1234`
   - Confirm Password: `test1234`
   - **Role: Select "Inventory Manager"** (or leave as default)
   - Check "Agree to Terms"
3. Click **"Sign Up"**
4. **Expected Results:**
   - Toast: "Account created as inventory manager!"
   - Redirected to `/login`

5. Login:
   - Email: `inventory@test.com`
   - Password: `test1234`

6. **Expected Results:**
   - Redirected to **`/dashboard`**

---

## Debugging If Something Goes Wrong

### Check the Logs

#### Browser Console (F12):
Look for `[CLIENT]` logs showing:
```
[CLIENT] Starting signup...
[CLIENT] Calling Supabase auth.signUp...
[CLIENT] Auth signup successful, user ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
[CLIENT] Calling /api/auth/signup endpoint...
[CLIENT] API response status: 200
[CLIENT] API response data: {...}
[CLIENT] Signup completed successfully with role: admin
```

#### Terminal Console:
Look for `[SIGNUP-API]` logs showing:
```
[SIGNUP-API] Request received
[SIGNUP-API] Body received: { email: 'admin@test.com', name: 'admin_user', role: 'admin', ... }
[SIGNUP-API] Creating admin client...
[SIGNUP-API] Admin client created successfully
[SIGNUP-API] Step 1/2: Upserting user record...
[SIGNUP-API] User record upserted successfully: [...]
[SIGNUP-API] Step 2/2: Upserting user_roles record...
[SIGNUP-API] User roles record upserted successfully: [...]
[SIGNUP-API] Signup completed successfully
```

### Error: "SUPABASE_SERVICE_ROLE_KEY is missing"

**Fix:** Add to `.env.local` and restart server

### Error: "new row violates row level security policy"

**Fix:** Run `COMPLETE_DATABASE_SETUP.sql` again in Supabase SQL Editor to update RLS policies

### Error: "relation "public.users" does not exist"

**Fix:** Tables don't exist. Run `COMPLETE_DATABASE_SETUP.sql` in Supabase

### Error: "duplicate key value violates unique constraint"

**Fix:** User email already exists. Try signup with different email (e.g., `admin2@test.com`, `supplier2@test.com`)

---

## Verify Data in Supabase

After successful signup & login, verify the data in Supabase:

1. Go to **Supabase Dashboard** → **Table Editor**
2. Check **`users`** table:
   - Should see records with `auth_user_id`, `email`, `name`, `role`, `organization_name`
3. Check **`user_roles`** table:
   - Should see records with `user_id` (same as `auth_user_id`), `role`, `organization_name`

---

## Expected Redirects by Role

| Role | After Login Redirect |
|------|---------------------|
| Admin | `/admin/dashboard` |
| Supplier | `/suppliers/dashboard` |
| Transporter | `/driver/dashboard` |
| Inventory Manager | `/dashboard` |

---

## Complete Flow Summary

```
1. User visits /signup
   ↓
2. Fills form with role selection
   ↓
3. Clicks "Sign Up"
   ↓
4. Browser calls: supabase.auth.signUp(email, password)
   ↓
5. Supabase creates auth user → Returns user.id
   ↓
6. Browser calls: POST /api/auth/signup with auth_user_id + role
   ↓
7. Server uses SERVICE_ROLE to bypass RLS and creates:
   - users table record (with role)
   - user_roles table record (with role)
   ↓
8. User redirected to /login
   ↓
9. User enters same email + password
   ↓
10. Clicks "Sign In"
    ↓
11. Browser calls: supabase.auth.signInWithPassword(email, password)
    ↓
12. Browser calls: GET /api/auth/user-role
    ↓
13. Server fetches role from user_roles table
    ↓
14. Server returns: { role, redirect: "/admin/dashboard" }
    ↓
15. Browser redirects to role-specific dashboard
```

---

## Success Indicators

✅ Signup shows correct role toast  
✅ Console shows `[CLIENT]` and `[SIGNUP-API]` logs  
✅ Redirects to `/login` after signup  
✅ Login shows "logged in as [role]" toast  
✅ Redirects to role-specific dashboard  
✅ Data appears in Supabase tables  

If all of these work, your authentication system is ready to use!
