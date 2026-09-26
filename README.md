# 🍽️ Orderly — QR Restaurant Ordering & Live Dashboard

Orderly is a project-focused QR ordering system:

**Scan table QR → Browse menu → Build cart → Place order → Restaurant receives live order → Update status**

The original 2025 version was a front-end-only prototype. The current version keeps that idea and adds the missing backend and operations layer.

## Pages

- `index.html` — guest ordering page
- `admin.html` — restaurant live-order dashboard
- `qr-generator.html` — table-specific QR link generator

## Features

- Table-aware QR links using URL parameters
- Mobile-first ordering UI
- Cart quantity controls and totals
- Firestore order persistence
- Live dashboard with status flow: **New → Preparing → Ready → Completed**
- Cancel order flow
- Dashboard status counters and revenue summary
- Demo mode when Firebase is not configured
- QR generator for table tent cards

## Firebase setup

1. Create a Firebase project.
2. Add a Firebase Web App.
3. Create a Firestore database.
4. Put the Web App configuration into `firebase-config.js`.
5. Start with `firebase.rules.example` only for local/classroom testing.
6. Open `qr-generator.html` and create a QR link for each table.
7. Open `admin.html` on the restaurant/kitchen screen.

### Order document

```
{
  restaurantId: "demo-restaurant",
  restaurant: "Orderly Restaurant",
  table: "T4",
  guest: "Rahul",
  phone: "optional",
  items: [
    { id: "m1", name: "Masala Dosa", price: 120, qty: 2 }
  ],
  total: 240,
  status: "new",
  createdAt: <Firestore timestamp>
}
```

## Important security note

The example Firestore rules are intentionally permissive for a classroom/demo prototype. For a real deployment, use Firebase Authentication, restaurant/staff roles, and restaurant-scoped security rules.

## Project positioning

Orderly is best presented as an **engineering project / working prototype**, not as a claim of a novel restaurant-ordering business. The useful technical story is the integration of QR context, a customer-facing web app, cloud persistence, and a real-time operations dashboard.

## Planned upgrades

- Firebase Authentication and staff roles
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
