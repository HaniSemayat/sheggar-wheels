# Sheggar Wheels — Rendering Strategy Specification (`STRATEGY.md`)

This document details the rendering strategy adopted for each route segment in **Sheggar Wheels** across Next.js 16.4.2 App Router.

---

## 1. Strategy Taxonomy

| Strategy | Description | Typical Use Case |
|---|---|---|
| **Static (SSG / Prerendered)** | HTML is generated ahead of time at build time or during incremental compilation. | Marketing landing page, static about/help content. |
| **Dynamic (Server-Rendered)** | HTML is rendered on the server on each incoming request using request cookies and headers. | Role-protected dashboards, authenticated profile pages, receipts. |
| **Revalidated / ISR** | Statically generated pages recomputed periodically or triggered via cache tags. | Public vehicle catalogue with cached active listings. |
| **Client-Interactive (CSR / Islands)** | Interactive components running in the browser utilizing React hooks, event listeners, and browser state. | Filter sidebars, search input, date pickers, gallery carousels. |

---

## 2. Route-by-Route Breakdown

| Route | Segment File | Rendering Strategy | Rationale & Data Strategy |
|---|---|---|---|
| `/` | `app/(public)/page.js` | **Static Shell + Server Component** | High-performance initial paint; marketing hero and how-it-works content is universal across visitors. |
| `/cars` | `app/(public)/cars/page.js` | **Dynamic / Revalidated Server Shell + Client Island** | Reads active, approved vehicle inventory from the database; delegates multi-parameter search/filtering to Client Island `CarsCatalogue.jsx`. |
| `/cars/[id]` | `app/(public)/cars/[id]/page.js` | **Dynamic Server Shell with `generateMetadata`** | Generates SEO metadata dynamically based on vehicle ID; streams vehicle specifications; hydrates interactive booking form and reviews. |
| `/signin` | `app/signin/page.js` | **Static Shell + Client Form** | Clean presentation; authentication form manages client validation and return URL redirect. |
| `/signup` | `app/signup/page.js` | **Static Shell + Client Form** | Registration form capturing customer intent and details. |
| `/my-bookings` | `app/(public)/my-bookings/page.js` | **Dynamic (Authenticated)** | Renter-specific private booking history. Requires verified session cookie to select customer records. |
| `/bookings/[id]` | `app/(public)/bookings/[id]/page.js` | **Dynamic (Authenticated)** | Detailed booking summary and receipt. Strictly checks renter or owner ownership before rendering. |
| `/profile` | `app/(public)/profile/page.js` | **Dynamic (Authenticated)** | Private user profile displaying account credentials and roles. |
| `/owner/cars` | `app/owner/cars/page.js` | **Dynamic (Owner Protected)** | Owner vehicle management console. Filtered to vehicles matching the authenticated owner's profile. |
| `/owner/bookings` | `app/owner/bookings/page.js` | **Dynamic (Owner Protected)** | Owner request approval console with pending request badges and decision triggers. |
| `/admin` | `app/admin/page.js` | **Dynamic (Admin Protected)** | Marketplace administrative metrics and listing moderation console. Governed by `is_admin()` check. |

---

## 3. Data Fetching Architecture

- **Public Catalogue & Details:** Server Components fetch directly from authoritative PostgreSQL database or cache, passing serializable data props to client components.
- **Protected Actions (Mutations):** Handled via validated domain functions and server API routes / Server Actions that verify `auth.uid()` and enforce database-level invariants.
- **Cache Invalidation:** Updates to car listings and booking states invoke `revalidatePath('/cars')` and `revalidatePath('/cars/[id]')` to ensure consistent data across sessions.
