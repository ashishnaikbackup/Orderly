# 🍽️ Orderly — QR Restaurant Ordering & Live Dashboard

Orderly is a final-year engineering project / working prototype for QR-based restaurant ordering and live order operations.

**Scan table QR → Browse menu → Add items → Place order → Restaurant sees it live → Update status**

The current version uses **Supabase + PostgreSQL + Supabase Realtime** with a static frontend hosted on GitHub Pages.

## Live demo pages

### Customer T1 demo
https://ashishnaikbackup.github.io/Orderly/?restaurant=orderly-demo&table=T1

### Restaurant dashboard
https://ashishnaikbackup.github.io/Orderly/admin.html

The dashboard is protected by **Supabase Auth** and only assigned restaurant staff can access live order data.

### QR generator
https://ashishnaikbackup.github.io/Orderly/qr-generator.html

These are the main deployed pages for demonstrating the project.

## How the project works

1. A restaurant table is represented by a table number such as **T1**.
2. The QR code encodes a table-specific URL containing the restaurant slug and table number.
3. A guest scans the QR code and opens the customer page.
4. The customer sees the live menu from Supabase and adds items to the cart.
5. The order is stored in PostgreSQL.
6. Supabase Realtime pushes the new order to the authenticated restaurant dashboard.
7. Staff move the order through **New → Preparing → Ready → Completed** or cancel it.

### QR codes: T1 vs T2

T1 and T2 **do not use the same QR code**.

Examples:

`?restaurant=orderly-demo&table=T1`

`?restaurant=orderly-demo&table=T2`

These are different ordering URLs, so they generate different QR images. The QR generator supports a single table and a batch of all active tables.

## Pages / files

- `index.html` — customer ordering page
- `admin-login.html` — Supabase Auth staff sign-in
- `admin.html` — authenticated restaurant dashboard
- `qr-generator.html` — single/batch table QR generator
- `app.js` — customer ordering logic
- `admin-login.js` — authentication
- `supabase-admin.js` — dashboard, menu/table management and Realtime
- `supabase-config.js` — browser configuration using the publishable key
- `supabase-schema.sql` — database schema and RLS policies

## Current features

### Customer
- Table-aware ordering
- Mobile-first menu and cart
- Dynamic menu loading
- Active-table validation
- Cloud order persistence
- Local demo fallback if Supabase is unavailable

### Restaurant
- Staff login
- Roles: owner, manager, kitchen
- Live order dashboard
- Realtime order updates
- Order status workflow and filters
- Order counts and revenue summary
- Menu add/edit/delete/availability controls for owner/manager
- Table add/activate/deactivate controls for owner/manager
- Table-specific QR links

### Backend
- PostgreSQL relational schema
- Row Level Security
- Restaurant staff membership
- Restaurant-scoped access policies
- Supabase Realtime on orders and menu changes

## Supabase setup

Project: **Orderly**

Project URL:
`https://wqbypuysddrsudledsan.supabase.co`

The browser uses the Supabase **publishable** key. Never put a service-role/secret key into frontend files.

### Create the first staff account

1. In Supabase Dashboard → Authentication → Users, create a staff user with email/password.
2. Copy the user's UUID.
3. Run this SQL in the Supabase SQL Editor:

```sql
insert into public.restaurant_staff(user_id, restaurant_id, role)
select
  '<AUTH_USER_UUID>',
  r.id,
  'owner'
from public.restaurants r
where r.slug = 'orderly-demo'
on conflict (user_id, restaurant_id) do update set role = excluded.role;
```

4. Open the dashboard URL and sign in.

Use `owner` for the project owner, `manager` for restaurant operations/menu/table management, or `kitchen` for order-status work.

## Security model

Customer ordering remains public so guests do not need an account.

Restaurant operations are protected:
- anonymous users can read active menu/table data and create an order only for a valid active table
- anonymous users cannot read/update/delete restaurant orders
- authenticated staff only see the restaurant they are assigned to
- only owner/manager can edit menu and table configuration
- kitchen staff can update order status but do not receive menu/table write permissions
- authorization uses the restaurant staff table, not editable user metadata

This is substantially safer than the original demo dashboard, but still a project prototype. Production hardening would additionally include server-side price validation, rate limiting, payment controls and stronger operational monitoring.

## Project positioning

Orderly is best presented as an **engineering project / working prototype**, not as an original restaurant-tech startup.

Its technical value is the integration of:

**QR context + responsive frontend + relational database + authentication + RLS + realtime operations**

## Verification

Backend and integration checks completed on **September 26, 2026**:
- Supabase project active
- RLS enabled on application tables
- staff membership table added
- authenticated dashboard access model implemented
- Realtime enabled for orders and menu changes
- guest order insert restricted to valid active tables
- previous live order insert/read/delete integration test completed successfully

## Developer

**Ashish Naik**  
GitHub: https://github.com/ashishnaikbackup