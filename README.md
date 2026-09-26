# 🍽️ Orderly — QR Restaurant Ordering & Live Dashboard

Orderly is a final-year/project-focused QR ordering system:

**Scan table QR → Browse menu → Add items → Place order → Restaurant sees it live → Update status**

The original 2025 version was a front-end-only prototype. The current version uses **Supabase + PostgreSQL + Realtime** for the backend.

## Pages

- `index.html` — guest ordering page
- `admin.html` — restaurant live-order dashboard
- `qr-generator.html` — table QR generator

## Current stack

- HTML5 / CSS3 / JavaScript
- Supabase JavaScript client
- PostgreSQL database
- Supabase Realtime (Postgres Changes)
- GitHub Pages-compatible static frontend

## Features

- Table-specific QR URLs
- Mobile-first menu and cart
- Dynamic menu loading from Supabase
- Active-table validation
- Cloud order persistence
- Real-time restaurant dashboard
- Order workflow: **New → Preparing → Ready → Completed**
- Cancel order
- Order status counters and revenue summary
- Local demo fallback when Supabase is unavailable

## Supabase setup

The connected project is named **Orderly**.

Project URL:
`https://wqbypuysddrsudledsan.supabase.co`

The browser config lives in `supabase-config.js` and uses a Supabase **publishable** key. Do not replace it with a service-role/secret key.

The database schema and seed data are documented in:
`supabase-schema.sql`

The live database currently contains:
- `restaurants`
- `tables`
- `menu_items`
- `orders`

Realtime is enabled for `orders`.

## Demo flow

1. Open `qr-generator.html`.
2. Use the `orderly-demo` restaurant and a table such as T1.
3. Open the generated table menu.
4. Add food and place the order.
5. Open `admin.html` in another browser tab/window.
6. The order should appear in the dashboard.
7. Move it through **Preparing**, **Ready**, and **Completed**.

## Security note

The current RLS policies intentionally allow anonymous ordering and dashboard operations so the project can be demonstrated without a staff login.

That is suitable for a classroom/project prototype, **not** for a production restaurant system.

Before production:
- add Supabase Auth
- create staff/restaurant roles
- scope RLS by restaurant
- restrict who can update/delete orders
- validate menu prices server-side
- add payment/webhook verification if payments are introduced

## Project positioning

Orderly is best presented as an **engineering project / working prototype**, rather than as an original restaurant-tech startup.

Its technical value is the end-to-end integration of:
**QR context + responsive frontend + relational database + realtime operations dashboard.**

## Developer

**Ashish Naik**  
GitHub: https://github.com/ashishnaikbackup
