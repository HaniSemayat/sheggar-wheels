# Sheggar Wheels — Performance & Optimization Report (`PERF.md`)

This document tracks Core Web Vitals, performance targets, and architectural optimizations implemented in **Sheggar Wheels**.

---

## 1. Core Web Vitals Targets

Measurements follow standard Google Core Web Vitals thresholds:

| Metric | Target (Good) | Description |
|---|:---:|---|
| **LCP (Largest Contentful Paint)** | `< 2.5s` | Time taken to render the largest visible content element (hero image or heading). |
| **CLS (Cumulative Layout Shift)** | `< 0.1` | Visual stability score measuring unexpected layout shifts during load. |
| **INP (Interaction to Next Paint)** | `< 200ms` | Responsiveness of the interface when clicking buttons or typing in filters. |
| **FCP (First Contentful Paint)** | `< 1.8s` | Time until the browser renders the first piece of DOM content. |

---

## 2. Key Optimizations Implemented

1. **Font Optimization (`next/font`):**
   - Self-hosted Google Geist Sans and Geist Mono fonts loaded via `next/font/google`.
   - Zero external font render-blocking requests during runtime; automatic `font-display: swap` applied to prevent Invisible Text (FOIT).
2. **Server/Client Boundary Separation:**
   - Kept heavy layout chrome and public text as Server Components to reduce client JavaScript bundle size.
   - Dynamic imports for client-only libraries (e.g., Leaflet map and Recharts).
3. **Database Indexing:**
   - Multi-column index on `cars(status, city, neighbourhood)` for instant filtering across Addis Ababa sub-cities.
   - GiST index on `bookings` for sub-millisecond date conflict detection.
4. **CSS Token System:**
   - Lightweight custom properties in `globals.css` with zero CSS-in-JS runtime overhead.
   - Reduced motion queries (`prefers-reduced-motion: reduce`) disable transition delays for accessibility.

---

## 3. Production Measurement Protocol

Before final production deployment, local production builds will be profiled using Lighthouse:
```bash
npm run build
npm run start
```
Measured results from Chrome DevTools Lighthouse audit in an incognito window with simulated 4G throttling will be recorded in this document in Milestone 7.
