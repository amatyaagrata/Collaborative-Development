# Dashboard Module

This folder contains the UI implementation for the GoGodam Inventory Management System Dashboard.

## Current Status: Frontend UI
We have successfully implemented a static, visually rich dashboard interface. 
- **Layout:** Integrated with the main `AppLayout` featuring a persistent dark purple sidebar and top header.
- **Components:**
  - **StatCards:** Displays top-level metrics like Inventory Value, Total Stocks, New Orders, and Delivered using placeholder metrics.
  - **Charts:** Implemented a Product Summary donut chart and a Sales & Purchase comparison line chart UI.
  - **Trending Products:** A static table component dynamically mapped from local dummy data displaying fast-moving inventory.
- **Styling:** Controlled exclusively via `dashboard.css`, using custom CSS classes and animations without relying heavily on utility frameworks, ensuring a bespoke design.

## Future Plans: Backend & Database Integration
The application will eventually rely on a **Node.js + Express** backend connected to a **Supabase** (PostgreSQL) database. 

### How Management Will Change:
1. **API Integration:**
   - The static `dashboardData.ts` file currently supplying the mock data will be deleted or entirely replaced by `useEffect` hooks fetching data from REST APIs (e.g., `GET /api/dashboard/stats`).
2. **Dynamic Metrics Calculation:**
   - Supabase functions or Node.js aggregates will calculate the exact "Inventory Value" and "Total Stocks" by doing joins across `products`, `orders`, and `categories` tables.
3. **Database Schema Support:**
   - Expect tables like `orders` (to calculate active shipments) and `inventory_logs` (to track sales vs. purchases over time) to power the charts dynamically.
4. **Real-Time Capabilities:**
   - Since Supabase offers real-time subscriptions, the dashboard metrics (like new orders arriving) could be hooked up to listen to WebSocket channel updates, turning the static dashboard into a live-updating operations hub.
