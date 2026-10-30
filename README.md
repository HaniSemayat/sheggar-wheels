# Sheggar Wheels 🚗

> **Peer-to-Peer Car Rental Marketplace for Addis Ababa, Ethiopia**
> Developed as part of the IBT–QIYAS Full-Stack Software Development Program (Module 3 Extension).

[![Next.js](https://img.shields.io/badge/Next.js-16.4.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?logo=react)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20Database-3ECF8E?logo=supabase)](https://supabase.com/)

---

## 1. Project Overview

**Sheggar Wheels** connects private car owners in Addis Ababa with renters seeking flexible, transparent vehicle rentals. The platform models complete end-to-end user journeys for three actors:
- **Renters:** Browse vehicles across Addis Ababa neighbourhoods (Bole, CMC, Kazanchis, Mexico, etc.), filter by price, seats, transmission, make booking requests, and review completed rentals.
- **Owners:** List private vehicles, manage availability, review incoming booking requests, accept/decline rentals, and monitor earnings.
- **Administrators:** Review and moderate pending car listings, inspect demo accounts, resolve disputes, and publish marketplace announcements.

---

## 2. Tech Stack

- **Framework:** Next.js 16.4.2 (App Router, Server & Client Components)
- **UI & Components:** React 19.3.0, Lucide React icons
- **Styling:** CSS Modules + Global Design System (`globals.css`) with light/dark theme variables
- **Database:** PostgreSQL (hosted via Supabase) with Row Level Security (RLS)
- **Authentication:** Supabase Auth with cookie-based session verification
- **Data Visualization & Maps:** Recharts for earnings; Leaflet / React-Leaflet for location mapping
- **Typography:** Self-hosted Google Geist Sans & Mono via `next/font`

---

## 3. Key Architecture & Security Guardrails

- **Authoritative Database Source of Truth:** All cars, bookings, reviews, disputes, and profiles are persisted in PostgreSQL.
- **Database-Level Overlap Prevention:** PostgreSQL `EXCLUDE` constraint with GiST index prevents overlapping active bookings for the same vehicle:
  ```sql
  ALTER TABLE bookings ADD CONSTRAINT no_overlapping_active_bookings
    EXCLUDE USING gist (
      car_id WITH =,
      daterange(start_date, end_date, '[)') WITH &&
    )
    WHERE (status IN ('requested', 'confirmed', 'in_progress'));
  ```
- **Authoritative Price Snapshots:** The database trigger `trigger_prepare_booking` calculates rental days, applies the car's current daily rate, and records non-editable subtotal, fee, and total amounts.
- **Zero Trust Security:** Database Row Level Security (RLS) policies govern all tables. Users cannot view others' private bookings, modify others' cars, or self-assign the `'admin'` role.
- **Open Redirect Guardrail:** `safeReturnPath()` strictly validates all `?next=` return URLs to internal relative paths.

---

## 4. Documentation Directory

Detailed architectural specifications are maintained in dedicated reference documents:

| Document | Description |
|---|---|
| [**`DATA.md`**](./DATA.md) | Relational database schema, entity relationships, constraints, and storage migration matrix. |
| [**`STRATEGY.md`**](./STRATEGY.md) | Route-by-route rendering strategy breakdown (Static, Dynamic, Client Island). |
| [**`BOUNDARY.md`**](./BOUNDARY.md) | Server Component vs. Client Component boundaries and serialization guarantees. |
| [**`AUTH.md`**](./AUTH.md) | Supabase Auth, RBAC permissions matrix, RLS policies, and negative test specifications. |
| [**`FUTURE.md`**](./FUTURE.md) | Production roadmap: real TeleBirr/CBE payment integration, telematics, and legal compliance. |
| [**`PERF.md`**](./PERF.md) | Core Web Vitals targets, performance optimizations, and measurement protocols. |

---

## 5. Local Setup & Getting Started

### Prerequisites
- Node.js (v18.17+ or v20+)
- npm or pnpm

### Installation
1. Clone the repository and navigate to the project directory:
   ```bash
   cd projects/sheggar-wheels
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Populate `.env.local` with your Supabase project URL and anonymous publishable key.

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 6. Database Migrations & Seeding

SQL migration files are version-controlled in `supabase/migrations/`:

1. `20261027000001_initial_schema.sql` — Schema definitions, triggers, and exclusion constraints.
2. `20261027000002_rls_policies.sql` — Row Level Security policies and helper security functions.
3. `seed.sql` — 15 realistic Addis Ababa vehicle listings, demo profiles, bookings, and sample reviews.

---

## 7. Fictional Demonstration Accounts

| Role | Demo Email | Demo Password | Purpose |
|---|---|---|---|
| **Renter** | `renter@sheggar.demo` | `demo123` | Browsing, requesting rentals, viewing booking history & receipts, submitting reviews. |
| **Owner** | `owner@sheggar.demo` | `demo123` | Listing vehicles, setting prices, accepting/declining rental requests, monitoring earnings. |
| **Administrator** | `admin@sheggar.demo` | `demo123` | Moderating car listings, user account oversight, dispute resolution, announcements. |

> *Note: Demonstration passwords are used strictly in fictional demo environments.*

---

## 8. Available Scripts

- `npm run dev` — Starts the local Next.js development server with hot module replacement.
- `npm run build` — Compiles and builds the production application.
- `npm run start` — Runs the compiled production build locally.
- `npm run lint` — Runs ESLint across the codebase.
