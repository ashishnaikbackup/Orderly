# 🍽️ Orderly — QR Restaurant Ordering & Live Dashboard

Orderly is a project-focused QR ordering system:

**Scan table QR → Browse menu → Build cart → Place order → Restaurant receives live order → Update status**

The original 2025 version was a front-end prototype. The current version adds a Supabase/PostgreSQL backend and a live restaurant operations dashboard.

## Pages

- `index.html` — guest ordering page
- `admin.html` — restaurant live-order dashboard
- `qr-generator.html` — table-specific QR link generator

## Features

- Table-aware QR links using URL parameters
- Mobile-first ordering UI
- Cart quantity controls and totals
- Supabase/PostgreSQL order persistence
- Realtime dashboard updates through Supabase Realtime
- Order status flow: **New → Preparing → Ready → Completed**
- Cancel order flow
- Dashboard status counters and revenue summary
- Demo mode when Supabase is not configured
- QR generator for table tent cards

## Supabase setup

1. Create a project at Supabase.
2. Open the project's SQL Editor.
3. Run `supabase-schema.sql`.
4. Copy the Project URL and publishable/anon key into `supabase-config.js`.
5. Open `qr-generator.html` and create a QR link for each table.
6. Open `admin.html` on the restaurant/kitchen screen.

### Database shape

The project currently uses one main `orders` table:

- `id` — order ID
- `restaurant_name` — restaurant context
- `table_no` — table that placed the order
- `guest_name` — guest name
- `phone` — optional phone
- `items` — JSONB array containing ordered items
- `total` — order total
- `status` — new/preparing/ready/completed/cancelled
- `created_at` / `updated_at` — timestamps

The next architecture upgrade can split menu, tables, restaurants and order items into separate relational tables.

## Security note

The SQL file contains permissive policies for a classroom/demo prototype. Before any real public deployment, add authentication, staff roles, restaurant-scoped access, validation, and stricter Row Level Security policies.

## Project positioning

Orderly is best presented as an **engineering project / working prototype**, not as a claim of a novel restaurant-ordering business. The technical story is the integration of QR context, a customer web app, PostgreSQL persistence, and a realtime operations dashboard.

## Next upgrades

- Supabase Auth + staff roles
- Dynamic menu management
- Restaurant setup page
- Kitchen display mode
- Order history and analytics
- Print-friendly kitchen tickets
- Optional UPI payment integration
- PWA/offline improvements

## Developer

**Ashish Naik**  
GitHub: https://github.com/ashishnaikbackup
