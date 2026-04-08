# QUICK START - Get Signup & Login Working NOW

## 3-Step Setup (5 minutes)

### Step 1: Run Database Setup (1 min)
1. Open Supabase Dashboard
2. Go to SQL Editor → New Query
3. Copy entire file: `COMPLETE_DATABASE_SETUP.sql`
4. Click Execute
5. Wait for "Database rebuild completed successfully"

### Step 2: Restart Dev Server (1 min)
```bash
# Stop current server (Ctrl+C)
npm run dev
```

### Step 3: Test Signup (3 min)

**Go to: http://localhost:3000/signup**

**Try these 4 test accounts:**

#### Test 1: Admin
- Email: `admin@test.com`
- Username: `admin1`
- Organization: `Admin Org`
- Password: `test1234`
- Role: **Admin**
- ✅ Should redirect to `/admin/dashboard` after login

#### Test 2: Supplier
- Email: `supplier@test.com`
- Username: `supplier1`
- Organization: `Supplier Org`
- Password: `test1234`
- Role: **Supplier**
- ✅ Should redirect to `/suppliers/dashboard` after login

#### Test 3: Transporter
- Email: `transporter@test.com`
- Username: `transporter1`
- Organization: `Transport Org`
- Password: `test1234`
- Role: **Transporter**
- ✅ Should redirect to `/driver/dashboard` after login

#### Test 4: Inventory Manager
- Email: `inventory@test.com`
- Username: `inventory1`
- Organization: `Inventory Org`
- Password: `test1234`
- Role: **Inventory Manager**
- ✅ Should redirect to `/dashboard` after login

---

## What's Fixed

✅ **Signup** - Creates users + roles in database  
✅ **Roles** - Stores selected role (admin, supplier, transporter, inventory manager)  
✅ **Login** - Fetches user role after auth  
✅ **Redirect** - Routes to correct dashboard based on role  
✅ **RLS** - Service role can access database for server-side operations  
✅ **Logging** - Console shows exactly what's happening  

---

## If Something Breaks

### Error: "SUPABASE_SERVICE_ROLE_KEY missing"
→ Add to `.env.local` and restart dev server

### Error: "Database error"
→ Run `COMPLETE_DATABASE_SETUP.sql` again

### Error: "Email already exists"
→ Use different email (e.g., `admin2@test.com`)

### Error: "RLS policy violation"
→ Run `COMPLETE_DATABASE_SETUP.sql` to fix RLS policies

---

## Files Changed

1. ✅ `COMPLETE_DATABASE_SETUP.sql` - All tables, RLS, and sample data
2. ✅ `app/api/auth/signup/route.ts` - Server-side profile creation
3. ✅ `app/api/auth/user-role/route.ts` - NEW: Get user role and redirect
4. ✅ `app/(auth)/login/page.tsx` - Updated to use role-based redirect
5. ✅ `app/(auth)/signup/page.tsx` - Shows role in success toast

---

## Result

You now have:
- ✅ Working signup with role selection
- ✅ Working login that remembers role
- ✅ Automatic redirect to correct dashboard
- ✅ Different dashboards for each role
- ✅ Database automatically saves user info
- ✅ RLS policies secure the data

Start testing! 🚀
