# GoGodam - Collaborative Development Platform

Welcome to the GoGodam development repository. This platform is an end-to-end multi-tenant solution designed to manage inventory, suppliers, and deliveries with strict role-based access control.

## Overview

GoGodam streamlines the supply chain process by connecting inventory managers, suppliers, and transporters on a single, unified platform. Built with Next.js and Supabase, it ensures real-time updates, secure data isolation, and a seamless user experience across different organizational roles.

## Features

- **Role-Based Access Control**: Secure routing and database policies (RLS).
- **Multi-Tenant Architecture**: Strict data isolation between different organizations.
- **Real-time Updates**: Live order tracking, stock movements, and notifications.
- **Scalable Backend**: Next.js 14 App Router paired with Supabase PostgreSQL.
- **Modern UI**: Tailored dashboards optimized for each specific business role.

## Quick Start (5-Minute Setup)

### 1. Environment Configuration
Create a `.env.local` file in the project root with your Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Database Initialization
1. Navigate to your **Supabase Dashboard** -> **SQL Editor**.
2. Run the code from `DATABASE_SCHEMA_V3.sql` (or `MULTI_TENANT_SCHEMA.sql` for the multi-tenant version) located in the `collaborative-development` directory.
3. This will create all required tables, Row Level Security (RLS) policies, triggers, and sample data.

### 3. Create Test Accounts
Run the following command to generate test users for every role in the 'GoGodam Corp' organization:

```bash
node scripts/create-test-users.mjs
```

## Testing Credentials

All auto-generated test accounts use the password: `Password123!`

| Role | Email | Redirect Path |
|------|-------|---------------|
| **Admin** | `admin@gogodam.com` | `/admin/dashboard` |
| **Supplier** | `supplier@gogodam.com` | `/suppliers/orders` |
| **Transporter** | `transporter@gogodam.com` | `/driver/dashboard` |
| **Inventory Manager** | `manager@gogodam.com` | `/dashboard` |

## User Manual

The GoGodam platform provides dedicated interfaces for each role. Below is a guide on how to navigate and utilize the system based on your assigned role:

### 1. Admin Dashboard
- **Access Management**: Approve or reject access requests from new users who sign up.
- **Organization Management**: Create and configure new tenant organizations.
- **System Overview**: Monitor high-level system statistics and oversee user role assignments.

### 2. Inventory Manager Dashboard
- **Stock Management**: View real-time stock levels, check warehouse capacity, and receive low-stock alerts.
- **Product Catalog**: Add, edit, and categorize products across the organization.
- **Purchase Orders**: Create and send purchase orders to verified suppliers when stock drops below minimum thresholds.

### 3. Supplier Dashboard
- **Order Fulfillment**: View incoming purchase orders from organizations.
- **Status Updates**: Accept, process, and mark orders as ready for pickup.
- **Product Offerings**: Manage the catalog of products that you supply to the platform.

### 4. Transporter (Driver) Dashboard
- **Delivery Assignments**: View a list of assigned shipments and required routes.
- **Status Tracking**: Update delivery statuses (e.g., Pending, In Transit, Delivered) in real-time.
- **Vehicle Management**: View assigned vehicles for the day's route.

## Development Setup

To run the application locally:

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL, Authentication, RLS)
- **Language**: TypeScript / JavaScript
