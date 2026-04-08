# GoGodam - Setup & Deployment Guide

## Environment Variables

Create a `.env.local` file in the project root with these variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Get these from your Supabase dashboard:
1. Go to Project Settings → API
2. Copy the URL and anon key
3. Copy the service role key (keep this private, only for server-side)

## Database Setup

1. **Run the schema rebuild script** in Supabase SQL Editor:
   - Open your Supabase project
   - Go to SQL Editor
   - Create a new query
   - Copy the entire contents of `database-rebuild.sql`
   - Run it

2. **Apply RLS policies** in Supabase SQL Editor:
   - Copy the entire contents of `rls-policies.sql`
   - Run it

## Features

### Authentication
- **Sign Up** (`/signup`): Users create accounts with email, password, username, organization, phone, and select a role
- **Sign In** (`/login`): Users log in with email and password
- **Roles**: Admin, Supplier, Driver, Customer, Transporter

### User Management
- Role-based access control (RBAC) via `user_roles` table
- Secure server-side profile creation using service role key
- Auth profiles linked to app profiles via `auth_user_id`

### Data Structure
- `users`: Application user profiles
- `user_roles`: Role assignments and organization tracking
- `products`: Inventory items
- `orders`: Order management
- `categories`: Product categories
- `suppliers`: Supplier records
- `organizations`: Organization records
- `deliveries`: Delivery tracking
- `driver_assignments`: Driver job assignments
- `notifications`: User notifications

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to test.

## Auth Flow

1. User signs up with email, password, and role
2. Supabase creates auth record in `auth.users`
3. Frontend calls `/api/auth/signup` with user metadata
4. Server-side route (using service role key) creates:
   - `users` record with auth_user_id
   - `user_roles` record with role assignment
5. User receives confirmation email
6. User logs in on `/login` page
7. Auth state is managed by Supabase and maintained via cookies

## Error Handling

All API routes include:
- Try-catch error handling
- Validation of required fields
- Detailed error messages
- Console logging for debugging

## Security

- ✅ RLS enabled on all tables
- ✅ Service role key only used server-side
- ✅ Auth profiles separate from app profiles
- ✅ Timestamp updates via triggers
- ✅ Role validation on signup
- ✅ No sensitive data in client code

## Testing

### Test Sign Up Flow
1. Go to `/signup`
2. Fill in all fields
3. Select a role
4. Submit
5. Check your email for confirmation link
6. Go to `/login` and sign in

### Test Sign In Flow
1. Go to `/login`
2. Enter your email and password
3. Submit
4. Should redirect to `/dashboard`

## Troubleshooting

**"Missing Supabase environment variables"**
- Check `.env.local` has all 3 required variables
- Verify no typos in variable names

**"Database error saving new user"**
- Ensure database schema is created from `database-rebuild.sql`
- Verify RLS policies are applied from `rls-policies.sql`
- Check service role key is correct and has full access

**"Profile creation failed"**
- Check browser console for error details
- Check server logs for API errors
- Verify user_roles table exists and has correct structure

**"Unauthorized to create profile"**
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Verify it's the actual service role key, not anon key

## Next Steps

- Add more dashboard features
- Implement real-time notifications using Supabase subscriptions
- Add file uploads to Supabase Storage
- Integrate payment processing
- Add email notifications
