# Fix: "Database error saving new user" - Step by Step

## Root Cause

This error occurs at Supabase's auth level. The most common cause is **email confirmation is enabled but not working**.

---

## Quick Fix (2 minutes)

### Step 1: Open Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Click **"Project Settings"** (gear icon at bottom left)

### Step 2: Fix Authentication Settings

1. Click **"Authentication"** tab
2. On the left, find **"Email Templates"** or **"Providers"**
3. Look for **"Email Confirmations"** setting
4. Check if it says **"Required"** or **"Enabled"**

### Step 3: Disable Email Confirmation for Development

If email confirmations are **required**:

1. Click **"Providers"** on left menu
2. Click **"Email"** 
3. Find the toggle for **"Confirm email"** or **"Email Confirmations"**
4. **Toggle it OFF** for development
5. Click **"Save"**

This allows users to sign up without confirming their email.

### Step 4: Test Signup Again

```
http://localhost:3000/signup
Email: test@example.com
Password: test1234
```

---

## Alternative Fix: If Toggling Doesn't Work

### Check Email Provider

1. Go to **Project Settings → Authentication → Providers**
2. Click **"Email"**
3. Verify that email is properly configured
4. If you see "Email not configured", you need to set up email or disable email confirmations

### Disable All Email Verification

1. Go to **Project Settings → Authentication → Email Templates**
2. Turn OFF all email-related confirmations for development

---

## For Production

When deploying to production:

1. **Enable email confirmations** so users verify their email
2. **Configure a real email provider** (SendGrid, AWS SES, etc.)
3. Users will need to confirm their email before they can log in

For development, disabling it allows you to test quickly.

---

## After Making Changes

1. **Restart your dev server**:
   ```bash
   npm run dev
   ```

2. **Try signing up again**:
   - Go to http://localhost:3000/signup
   - Use new email each time (e.g., test1@example.com, test2@example.com)
   - Password: test1234

3. **Check console for logs**:
   - Browser: F12 → Console
   - Terminal: Watch for [SIGNUP-API] logs

---

## If Still Getting Error

### Check Supabase Logs

1. Go to **Project Dashboard**
2. Click **"Logs"** tab (top right)
3. Select **"Auth"** from the dropdown
4. Look for any error messages about email or database
5. Check the timestamp - it should match when you tried to sign up

### Common Messages & Fixes

| Error | Fix |
|-------|-----|
| "Email confirmation required" | Disable email confirmations in settings |
| "Unable to send email" | Disable email confirmations for dev |
| "Function error" | Check if there's a broken trigger |
| "Invalid email" | Use a valid email format |

---

## Verify Everything Works

After disabling email confirmation:

1. ✅ Try signup with `admin@test.com`
2. ✅ Check no error appears
3. ✅ You should see toast: "Account created as admin!"
4. ✅ Redirected to `/login`
5. ✅ Login with same credentials
6. ✅ You should see: "Welcome back! You are logged in as admin"
7. ✅ Redirected to `/admin/dashboard`

If all pass → **Signup is working!** 🎉

---

## Screenshot Guide

**To disable email confirmation:**
1. Supabase Dashboard
2. Project Settings (bottom left)
3. Authentication tab
4. Providers → Email
5. Toggle "Confirm email" → OFF
6. Save

The toggle usually looks like this when OFF: ⚪ (gray circle on left)
