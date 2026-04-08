# Bug Fixes — April 8, 2026

## What was done

Audited and fixed 18 bugs across the supplier, driver, and dashboard modules.

### Critical Fixes (app was freezing)
- **Supabase client was being recreated on every render**, causing infinite loops in 5 pages. Fixed by making it a singleton — one instance shared everywhere.
- **Realtime hooks (orders & trips) were subscribing/unsubscribing in a loop**, flooding Supabase with connections. Fixed with `useRef` for callbacks.

### Broken Features Fixed
- **Drivers couldn't move trips from "accepted" to "picked up"** — the button existed but wasn't wired. Now works.
- **All supplier dashboard links were 404ing** — used `/supplier/` (singular) but the route is `/suppliers/` (plural). Fixed all 3 links.
- **Supplier dashboard query was missing `unit_price`** — caused a crash when expanding order cards. Added to the query.

### Crash Prevention
- **TripCard crashed if the linked order was deleted** — added null checks on all `trip.orders` access.
- **OrderCard crashed if `order_items` was null** — added fallback defaults.

### Quality of Life
- **Drivers had no way to log out** — added a Sign Out button to the driver sidebar.
- **Escalation timers kept running after page navigation** — added cleanup on unmount.
- **Duplicate type definitions** across 4 files — extracted into a shared `types/models.ts`.

## Files Changed
- `lib/supabase/client.ts` — singleton pattern
- `types/models.ts` — new shared types
- `app/dashboard/page.tsx` — deps fix
- `app/driver/dashboard/page.tsx` — workflow + types
- `app/suppliers/dashboard/page.tsx` — routes, query, timers, callback
- `app/suppliers/orders/page.tsx` — types + deps
- `hooks/useRealtimeOrders.tsx` — ref pattern
- `hooks/useRealtimeTrips.tsx` — ref pattern
- `components/driver/trips/TripCard.tsx` — null safety
- `components/supplier/orders/OrderCard.tsx` — null safety
- `components/layout/DriverLayout.tsx` — logout button
