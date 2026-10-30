# Sheggar Wheels — Server & Client Boundary Architecture (`BOUNDARY.md`)

This document defines the boundary between React Server Components (RSC) and Client Components across **Sheggar Wheels**, explaining why each module is assigned to its execution environment.

---

## 1. Architectural Philosophy

Next.js App Router defaults all components to **Server Components**. Server Components execute exclusively on the server, producing rendered HTML and a serialized React Server Component payload (RSC Payload).

The `"use client"` directive is applied deliberately only at the boundary where browser capabilities are required:
- Interactive user events (`onClick`, `onChange`, `onSubmit`)
- React lifecycle and state hooks (`useState`, `useEffect`, `useMemo`, `useRef`)
- Browser-only APIs (`window`, `localStorage`, `sessionStorage`, `navigator`)
- Third-party client libraries (Leaflet maps, Recharts)

```
[ Root Layout (Server) ]
  └── [ Public Layout (Server) ]
        ├── SiteHeader (Client)          <-- Interactive mobile drawer, auth state dropdown
        ├── Page Content (Server Shell)  <-- SEO metadata, server data fetch
        │     └── Island Component (Client) <-- Date picker, search input, filters
        └── SiteFooter (Server)          <-- Static links, copyright
```

---

## 2. Component Boundary Inventory

| Component / Module | Boundary | Rationale |
|---|---|---|
| `app/layout.js` | **Server** | Root document layout; injects Google Geist fonts and global CSS without client bundle overhead. |
| `app/(public)/layout.js` | **Server** | Composes public page shell and header/footer without client state. |
| `components/layout/SiteHeader.jsx` | **Client** | Manages responsive menu toggle, avatar dropdown menu, and active session display. |
| `components/layout/SiteFooter.jsx` | **Server** | Pure presentation with static navigational links. |
| `app/(public)/page.js` | **Server** | Landing page with hero imagery, value propositions, and how-it-works content. |
| `app/(public)/cars/page.js` | **Server** | Entry point fetching initial vehicle inventory and passing serializable data. |
| `app/(public)/cars/CarsCatalogue.jsx` | **Client** | Instant search typing, filter dropdowns, sorting toggles, and results counter. |
| `app/(public)/cars/[id]/page.js` | **Server** | Implements `generateMetadata` for dynamic car page titles and Open Graph data. |
| `app/(public)/cars/[id]/CarDetailsClient.jsx` | **Client** | Controls photo gallery tab selection and combines car specs with booking form. |
| `components/bookings/BookingForm.jsx` | **Client** | Interactive date picking, day calculation, pricing preview, and submission handler. |
| `app/(public)/cars/[id]/ReviewSection.jsx` | **Client** | Star rating picker, character count validation, and submission feedback. |
| `app/(public)/my-bookings/MyBookings.jsx` | **Client** | Client-side tab switching (All, Pending, Confirmed, Completed) and booking search. |
| `app/(public)/bookings/[id]/BookingDetails.jsx` | **Client** | Renter receipt view, permitted action buttons (e.g., Cancel request). |
| `app/(public)/profile/Profile.jsx` | **Client** | Displays user profile information and sign-out handler. |
| `app/owner/cars/OwnerCars.jsx` | **Client** | Vehicle creation form, inline editing state, image path input. |
| `app/owner/bookings/OwnerBookings.jsx` | **Client** | Interactive owner decision controls (Accept request / Reject request). |
| `components/AdminDashboard.jsx` | **Client** | Administrative moderation table, filter toggles, approval/rejection triggers. |
| `components/AccountForm.jsx` | **Client** | Unified sign-in/sign-up form, password visibility toggle, demo account pre-fills. |

---

## 3. Boundary Rules & Data Safety

1. **Serialization Guarantee:** All props passed from Server Components to Client Components are strictly serializable JSON primitives (strings, numbers, booleans, plain arrays, and objects).
2. **Environment Variable Protection:** Server secrets (such as `SUPABASE_SERVICE_ROLE_KEY`) are accessed strictly within server modules and never imported into modules marked with `"use client"`.
3. **Graceful Hydration:** Client components reading browser storage or cookies wait for initial mount before rendering dynamic user state to avoid React hydration mismatch warnings.
