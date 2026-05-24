# Gogodam Sprint 2 — Technical Study & Viva Preparation Guide

Welcome! This study guide covers the architectural decisions, database schemas, API routes, and frontend logic implemented during **Sprint 2** of the **Gogodam Inventory Management & Logistics System**. 

Use this guide to master the technical concepts, review the codebase, and prepare for your individual report viva/defense.

---

## Table of Contents
1. **The Architecture of Gogodam**
2. **The Tech Stack Breakdown**
3. **Core Programming Concepts (React, Hooks, Next.js Routing)**
4. **Step-by-Step Feature Flows (How the code executes)**
5. **Database Security (RLS Policies & Optimization)**
6. **Email Integration (Nodemailer & SMTP)**
7. **File Directory Reference Sheet**
8. **Viva Survival Guide (Top 15 Q&As)**

---

## 1. The Architecture of Gogodam

Gogodam is a **multi-tenant** platform. Multi-tenancy is a software architecture where a single instance of the software serves multiple client organizations (tenants). Each tenant's data must be completely isolated and invisible to other tenants.

### The Role Hierarchy:
The platform manages four distinct roles within each organization:
1. **Administrator (Admin):** Manages user access, views global metrics (total valuation, user stats, category breakdowns), and approves onboarding requests.
2. **Supplier:** Uploads product inventory, tracks incoming purchase orders, approves/rejects orders, and assigns transporters/drivers to deliveries.
3. **Inventory Manager (IM):** Oversees warehouse stock. Can perform manual sales logs, print transaction receipts, and monitor minimum stock level alerts.
4. **Transporter (Driver):** Manages delivery logistics. Receives delivery assignments, updates status (Accepted, Rejected, In Transit, Delivered) in real-time.

---

## 2. The Tech Stack Breakdown

| Technology | Role in Gogodam | Why it matters |
| :--- | :--- | :--- |
| **Node.js** | Backend Runtime | Powers our local development server, handles package management (`npm`), and builds the Next.js application. |
| **React** | Frontend Library | Component-based UI engine. Handles page state rendering, interactive buttons, modal overlays, and visual forms. |
| **Next.js (App Router)** | Full-Stack Framework | Organizes file-based page routing (e.g. `/signup`, `/supplier/orders`) and hosts serverless backend API endpoints (`route.ts`). |
| **TypeScript** | Static Typing | Prevents runtime bugs by strictly defining the shape of our data. Ensures we don't call properties that don't exist on objects. |
| **PostgreSQL** | Relational Database | Relational database containing structured tables linked by Foreign Keys, protected by Row Level Security (RLS) rules. |
| **Supabase** | Backend-as-a-Service | Provides managed Authentication (JWTs), instant Database REST APIs, and WebSockets for real-time delivery tracking. |

---

## 3. Core Programming Concepts

### React Hooks
Hooks allow functional components to use state and other React features. 

#### A. `useState` (State Management)
Gives components memory. When state updates, React automatically re-renders the component to display the new data.
*   **Example from signup page:**
    ```typescript
    const [otpSent, setOtpSent] = useState(false);
    const [otpCode, setOtpCode] = useState("");
    ```
    *Calling `setOtpSent(true)` triggers React to display the verification code input block on the screen.*

#### B. `useEffect` (Side Effects)
Runs code after a component renders on screen. It is used to fetch data, set up event listeners, or run cleanup functions.
*   **Example from deliveries page:**
    ```typescript
    useEffect(() => {
      fetchOrders(); // Load data on mount
    }, []);
    ```

#### C. `useCallback` (Function Memoization)
Caches a function definition between renders. It is essential when passing functions down to child components or referencing them inside `useEffect` dependency arrays to prevent infinite rendering loops.

#### D. `useMemo` (Calculated Value Memoization)
Caches the result of a complex calculation so it only runs when its dependencies change.
*   **Example:** Calculating the subtotal, tax (13% VAT), and total price live on the sales form as the user inputs quantities.

### Routing & Route Groups
Next.js uses folder structures to define URL endpoints.
*   **Route Groups `(auth)` / `(dashboard)`:** Folders wrapped in parentheses are used to organize layout code and route groupings. They do **not** appear in the web browser URL path.
*   **API Handlers (`route.ts`):** Host HTTP methods like `GET`, `POST`, `PATCH`, and `DELETE`.

---

## 4. Step-by-Step Feature Flows

### A. The OTP Email Verification Flow
This feature prevents bot registrations by validating the user's email before allowing them to request account approval.

```
[Signup Page UI] --(POST Email)--> [/api/auth/send-otp]
                                           |
                              [Generate 6-Digit Random Code]
                                           |
                              [Save OTP to DB with 10-Min Expiry]
                                           |
                              [Nodemailer sends SMTP Email]
                                           |
[Enter 6-Digit Code] --(POST OTP)--> [/api/auth/verify-otp]
                                           |
                              [Validate Code & Expiry in DB]
                                           |
                              [Delete OTP on Match (Single Use)]
                                           |
[Unlock Submit Request] <--(Verified)------+
```

1. **Trigger:** User types their email on the `/signup` screen and clicks **"Send Verification Code"**.
2. **API Call:** The frontend sends a `POST` request to `/api/auth/send-otp` with the email body.
3. **Execution:** 
    * The backend generates a random code: `Math.floor(100000 + Math.random() * 900000)`.
    * It inserts the code into the `otp_verifications` table with a timestamp set to `now() + 10 minutes`.
    * It dispatches the email using Gmail SMTP via **Nodemailer**.
4. **Verification:** User inputs the code from their inbox. The frontend calls `/api/auth/verify-otp`.
5. **DB Evaluation:** The database searches for a matching, unexpired code. If valid, the backend deletes the code (preventing it from being used again) and returns `verified: true`. The frontend then unlocks the registration submit button.

### B. Transporter Assignment & Logistics Flow
This tracks orders from creation to completion, integrating database triggers to automatically sync physical inventory.

```
[Supplier Panel] --(Assigns Driver & Vehicle)--> [order_driver_assignments]
                                                               |
                                                   (Real-Time WebSockets Alert)
                                                               |
[Driver Portal] <--(View Assigned Delivery)---------------------+
      |
      +---> [Accept / Reject] --(PATCH status)--> [Update Assignment & PO Status]
      |
      +---> [Start Transit]   --(PATCH status)--> [Update to out_for_delivery]
      |
      +---> [Mark Delivered]  --(PATCH status)--> [Update PO to delivered]
                                                               |
                                                   (PostgreSQL DB Trigger Fires)
                                                               |
                                                   [Increment Product Stock]
                                                   [Log Stock Movement Record]
```

1. **Assigning:** The Supplier selects an approved order, picks an available driver/vehicle, and inserts a row in `order_driver_assignments`. The order status changes to `driver_assigned`.
2. **Real-time Alert:** The Transporter Deliveries portal utilizes Supabase WebSockets to listen for changes on the assignments table. The new order instantly appears on the driver's screen without a page reload.
3. **Driver Workflow:** 
    * **Accept:** Changes status to `accepted` in both assignments and purchase orders.
    * **Transit:** Changes status to `out_for_delivery` (in transit).
    * **Delivered:** Changes status to `delivered`.
4. **Trigger Hook:** The database trigger listens for `purchase_orders.status` updates. When it detects `'delivered'`, it automatically runs the trigger function.

---

## 5. Database Security: Row Level Security (RLS)

Data security is enforced directly at the database level using PostgreSQL Row Level Security.

### The Helper Session Functions
To determine who is requesting data, the database uses helper functions:
```sql
CREATE OR REPLACE FUNCTION get_current_org_id() RETURNS uuid AS $$
BEGIN
  RETURN current_setting('app.current_org_id', true)::uuid;
END;
$$ LANGUAGE plpgsql STABLE;
```
This retrieves the active tenant organization ID set during the user's connection session.

### The Isolation Policies
Policies are written for every table to isolate data by tenant organization.
```sql
CREATE POLICY product_isolation_policy ON products 
    FOR ALL USING (org_id = get_current_org_id()) 
    WITH CHECK (org_id = get_current_org_id());
```
*   **How it protects data:** If a user from Organization A queries `SELECT * FROM products;`, the database automatically appends `AND org_id = 'org_a_id'`. A user can never see or modify rows belonging to another organization. Even if a user tries to link a product to a supplier belonging to Organization B, the RLS policy hides Organization B's supplier, throwing a foreign key violation.

### Indexing Strategy
Because every query dynamically checks `org_id`, we built composite indices starting with `org_id` (e.g. `CREATE INDEX idx_products_org_id ON products (org_id);`). This allows the database to instantly locate rows matching the tenant context instead of performing slow tables scans, keeping performance high.

---

## 6. Email Integration: Nodemailer & SMTP

We use **Nodemailer** rather than third-party SaaS services like Resend in our final code.

### Transporter Configuration:
We establish a secure connection using Gmail's SMTP server:
*   **Host:** `smtp.gmail.com`
*   **Port:** `465` (Secure port using SSL/TLS encryption)
*   **Auth:** Requires `GMAIL_USER` and `GMAIL_APP_PASSWORD`.

### What is a Google App Password?
Google blocks direct logins from custom code scripts for security. To bypass this, we generate a unique **16-digit App Password** inside Google Account security settings. This acts as a single-use credential for our server, without exposing our master email password.

### Graceful Fallback for Local Development:
If credentials are not configured in the `.env.local` file, our code falls back gracefully:
```typescript
if (!gmailUser || !gmailPass) {
  console.log("------------------------------------------");
  console.log(`📧 [SIMULATED] SENDING EMAIL TO: ${to}`);
  console.log(`📄 CONTENT: \n${html.replace(/<[^>]*>?/gm, "")}`);
  console.log("------------------------------------------");
  return { success: true, simulated: true };
}
```
It prints the email content (stripping out HTML tags using Regular Expressions) directly into the terminal, allowing developers to read verification codes easily during testing.

---

## 7. File Directory Reference Sheet

| File Path | Tech Type | Primary Responsibility |
| :--- | :--- | :--- |
| [app/api/auth/send-otp/route.ts](file:///c:/Users/acer/Collaborative-Development/collaborative-development/app/api/auth/send-otp/route.ts) | Backend API | Generates OTP, writes to database with expiry, and calls SMTP sender. |
| [app/api/auth/verify-otp/route.ts](file:///c:/Users/acer/Collaborative-Development/collaborative-development/app/api/auth/verify-otp/route.ts) | Backend API | Validates matching OTP code, checks expiry, and deletes verified OTP records. |
| [app/(auth)/signup/page.tsx](file:///c:/Users/acer/Collaborative-Development/collaborative-development/app/(auth)/signup/page.tsx) | Frontend React | User sign-up page with role inputs, terms agreement, and OTP validation screens. |
| [app/(dashboard)/transporter/deliveries/page.tsx](file:///c:/Users/acer/Collaborative-Development/collaborative-development/app/(dashboard)/transporter/deliveries/page.tsx) | Frontend React | Driver dashboard with filter tabs, progress tracker stepper, and action buttons. |
| [app/api/delivery-status/route.ts](file:///c:/Users/acer/Collaborative-Development/collaborative-development/app/api/delivery-status/route.ts) | Backend API | Verifies driver assignments, updates status, and synchronizes PO records. |
| [FIX_DELIVERY_TRIGGER.sql](file:///c:/Users/acer/Collaborative-Development/collaborative-development/FIX_DELIVERY_TRIGGER.sql) | Database SQL | PostgreSQL function and trigger automating stock counts on order deliveries. |
| [app/(dashboard)/inventory-manager/reports/page.tsx](file:///c:/Users/acer/Collaborative-Development/collaborative-development/app/(dashboard)/inventory-manager/reports/page.tsx) | Frontend React | Sales logging layout for managers, with stock deductions and transaction receipt previews. |
| [app/(dashboard)/supplier/orders/page.tsx](file:///c:/Users/acer/Collaborative-Development/collaborative-development/app/(dashboard)/supplier/orders/page.tsx) | Frontend React | Supplier order management screen allowing approvals, rejections, and driver assignments. |
| [app/api/admin/stats/route.ts](file:///c:/Users/admin/stats/route.ts) | Backend API | Compiles total database metrics (valuations, user roles) for the admin dashboard. |
| [lib/email-service.ts](file:///c:/Users/acer/Collaborative-Development/collaborative-development/lib/email-service.ts) | Node.js Helper | Configures Nodemailer, hosts HTML layouts, and handles development terminal fallbacks. |

---

## 8. Viva Survival Guide (Top 15 Questions & Answers)

Here are the top questions examiners will ask you to test your understanding, along with the ideal responses:

#### Q1: What was your specific role in this team project?
*   **Answer:** *"I worked as a full-stack developer. On the backend, I built the OTP email verification API endpoints, configured Nodemailer with SMTP, and wrote PostgreSQL database triggers. On the frontend, I built the Transporter deliveries portal, the manual sales recording forms for Inventory Managers, and integrated real-time WebSocket subscriptions."*

#### Q2: How did you implement real-time delivery tracking?
*   **Answer:** *"We used Supabase Realtime, which operates over WebSockets. Inside the transporter deliveries component, we set up a postgres_changes listener on the `order_driver_assignments` table. Whenever the database records status updates, it immediately broadcasts the changes to active browser tabs, refreshing data instantly without requiring page reloads."*

#### Q3: Why did you use Next.js instead of regular React (Vite)?
*   **Answer:** *"React is only a frontend library; it cannot connect to databases securely or host server endpoints. Next.js is a full-stack framework. It allows us to keep our user interface in React while writing secure serverless API endpoints (like our SMTP email routes) in the same codebase."*

#### Q4: What is the purpose of Row Level Security (RLS)?
*   **Answer:** *"RLS enforces security constraints directly inside the database engine. Instead of relying on frontend code to filter tenant information, RLS automatically restricts table access based on the user's authenticated session organization ID, preventing data leakage between tenants."*

#### Q5: How does your database know which tenant is requesting data?
*   **Answer:** *"We set up a helper function `get_current_org_id()` that extracts the active tenant's organization ID from the session parameters. RLS policies use this ID to filter rows dynamically during query execution."*

#### Q6: Why did you use `try...catch` blocks in your API routes?
*   **Answer:** *"To prevent server crashes. If a database query fails or a connection drops, the `catch` block intercepts the exception, prints logs for developer debugging, and returns a clean JSON error response to the client browser instead of crashing the Next.js process."*

#### Q7: What is the difference between `useState` and `useEffect`?
*   **Answer:** *"`useState` creates local state (memory) inside a component, triggering a visual re-render when changed. `useEffect` is used to trigger side effects—like fetching data from APIs or subscribing to WebSockets—after the component renders on the screen."*

#### Q8: How did you prevent duplicate OTP uses?
*   **Answer:** *"Inside our verification handler API, as soon as we verify that the user's submitted OTP matches the database record and has not expired, we immediately run a SQL DELETE query to delete that token. This prevents users from re-submitting the same code."*

#### Q9: What are Gmail App Passwords and why are they needed?
*   **Answer:** *"Google blocks automated scripts from logging in with standard passwords to prevent security breaches. An App Password is a unique 16-character passcode generated in Google Account settings that allows Nodemailer to login safely without exposing the master account password or failing 2FA checks."*

#### Q10: How does your database trigger function execute without permissions?
*   **Answer:** *"We defined our PostgreSQL trigger function using the `SECURITY DEFINER` setting. This instructs the database to execute the stock updates with the permissions of the database administrator (the trigger creator), even though the driver calling the status update lacks direct permissions to modify inventory tables."*

#### Q11: What is a Composite Index, and how did it help your database performance?
*   **Answer:** *"A composite index is an index built on multiple columns. We created indexes starting with `org_id` combined with entity IDs (e.g. `org_id, category_id`). Since RLS filters every query by `org_id`, these indexes prevent slow full-table scans, keeping queries fast."*

#### Q12: Why did you use `useCallback` in your dashboard fetching logic?
*   **Answer:** *"We wrapped our `fetchOrders` function in `useCallback` to cache its definition. This prevents React from recreating the function on every render, which would trigger our `useEffect` hook to run repeatedly, causing infinite loading loops."*

#### Q13: What does `COALESCE` do in your SQL triggers?
*   **Answer:** *"`COALESCE` evaluates a list of inputs and returns the first non-null value. We used `COALESCE(current_stock, 0)` to ensure that if a product has a null stock level, it is treated as zero, preventing mathematical errors during calculations."*

#### Q14: How does multi-tenancy protect foreign key references?
*   **Answer:** *"Because RLS policies filter out all rows belonging to other tenants, if Tenant A tries to create a product referencing a supplier owned by Tenant B, the database acts as if that supplier ID does not exist, throwing a foreign key constraint error."*

#### Q15: How did you test your email alerts locally when SMTP was not configured?
*   **Answer:** *"We implemented a development fallback condition. If GMAIL credentials are missing, the email service converts HTML templates into plain text and logs the email details directly to the VS Code terminal. This lets us verify OTPs during local testing without configuring an active mail account."*
