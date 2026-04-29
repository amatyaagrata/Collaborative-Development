# GoGodam - Collaborative Development Platform

Welcome to the GoGodam development repository. This platform is designed to manage inventory, suppliers, and deliveries with role-based access control.

## 🚀 Quick Start - 5 Minute Setup

### 1. Environment Configuration
Create a `.env.local` file in the project root with your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Database Initialization
1. Go to your **Supabase Dashboard** → **SQL Editor**.
2. Run the code from **[COMPLETE_DATABASE_SETUP.sql](file:///Users/rohandeshar/Documents/Herald_Sem_4/Colab/Collaborative-Development/collaborative-development/COMPLETE_DATABASE_SETUP.sql)**.
3. This will create all tables, RLS policies, triggers, and sample data.

### 3. Create Test Accounts
Run the following command to generate test users for every role in the 'GoGodam Corp' organization:
```bash
node scripts/create-test-users.mjs
```

## 🧪 Testing Credentials
All test accounts use the password: **`Password123!`**

| Role | Email | Redirect Path |
|------|-------|---------------|
| **Admin** | `admin@gogodam.com` | `/admin/dashboard` |
| **Supplier** | `supplier@gogodam.com` | `/suppliers/orders` |
| **Transporter** | `transporter@gogodam.com` | `/driver/dashboard` |
| **Inventory Manager** | `manager@gogodam.com` | `/dashboard` |

## 🛠 Features
- **Role-Based Access Control**: Secure routing and database policies.
- **Real-time Updates**: Live order tracking and notifications.
- **Scalable Architecture**: Next.js 14 + Supabase with service-role security.
- **Modern UI**: Tailored dashboards for each business role.

## 📦 Development
```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.
