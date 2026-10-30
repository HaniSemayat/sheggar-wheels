# Sheggar Wheels — Authentication, Authorization & Security Guardrails (`AUTH.md`)

This document outlines the authentication architecture, role-based access controls (RBAC), database Row Level Security (RLS) enforcement, and negative testing requirements for **Sheggar Wheels**.

---

## 1. Authentication Architecture

Sheggar Wheels uses **Supabase Auth** for authoritative account authentication and session management.

- **Account Credentials:** Passwords are encrypted and managed securely via Supabase Auth (`auth.users`). No plaintext passwords are ever stored in public tables or browser storage.
- **Session Tokens:** Transmitted via secure, HTTP-only cookie headers parsed by Next.js server components and middleware.
- **Public Profile Synchronization:** The PostgreSQL trigger `on_auth_user_created` creates a corresponding row in `public.profiles` upon user registration.

---

## 2. Actors & Multi-Role Capability Matrix

Sheggar Wheels models user capabilities using an array of roles: `profiles.roles TEXT[]`. A single user account can hold both `'renter'` and `'owner'` capabilities simultaneously (for example, renting a vehicle on Monday and listing a private car on Wednesday).

| Permission / Capability | Visitor (Unauthenticated) | Renter | Owner | Administrator |
|---|:---:|:---:|:---:|:---:|
| Browse & search active catalogue | ✅ | ✅ | ✅ | ✅ |
| View vehicle details & reviews | ✅ | ✅ | ✅ | ✅ |
| Request vehicle booking | ❌ (Redirects to sign-in) | ✅ | ✅ | ✅ |
| Mock checkout & receipt | ❌ | ✅ | ✅ | ✅ |
| Cancel own eligible booking | ❌ | ✅ | ❌ | ✅ |
| Review completed rental | ❌ | ✅ (If completed) | ❌ | ✅ (Moderation) |
| List & edit own vehicle listings | ❌ | ❌ | ✅ | ✅ |
| Manage vehicle availability | ❌ | ❌ | ✅ | ✅ |
| Accept or decline booking requests | ❌ | ❌ | ✅ (Own cars) | ✅ |
| Reply to vehicle reviews | ❌ | ❌ | ✅ (Own cars) | ❌ |
| Moderate pending car listings | ❌ | ❌ | ❌ | ✅ |
| Suspend or reinstate user accounts | ❌ | ❌ | ❌ | ✅ |
| Resolve disputes & view platform fees | ❌ | ❌ | ❌ | ✅ |
| Publish platform announcements | ❌ | ❌ | ❌ | ✅ |

---

## 3. Defense-in-Depth Enforcement Strategy

Client-side UI checks (such as hiding buttons or conditional redirecting) are provided strictly for user convenience. **Security is authoritatively enforced on the trusted server and database layers:**

1. **Database Row Level Security (RLS):** All tables have RLS enabled with granular policies checking `auth.uid()`.
2. **Elevated Privilege Protection:**
   - Public registration assigns `roles = '{renter}'` or `'{renter, owner}'`. It **never** grants `'admin'`.
   - The PostgreSQL trigger `trigger_protect_profile_roles` blocks any attempt by a user to modify their own `roles` array or `status`.
3. **Financial Invariant Triggers:**
   - Booking prices, days, platform commissions, and totals are computed server-side by `trigger_prepare_booking`. The database rejects client-submitted prices.
4. **State Machine Integrity:**
   - The trigger `trigger_validate_booking_status` enforces permitted transitions in the booking lifecycle.
5. **Suspended Account Isolation:**
   - Accounts with `status = 'suspended'` are blocked at the RLS layer from creating cars, requesting bookings, or writing reviews.

---

## 4. Safe Return Navigation (`safeReturnPath`)

To prevent Open Redirect attacks (where an attacker crafts a link like `/signin?next=https://malicious-phishing.com`), the application routes all return navigation through `lib/auth-utils.js`:

```javascript
safeReturnPath(targetPath, fallback = "/")
```

- Accepts only internal relative paths starting with a single `/`.
- Rejects external protocols (`http://`, `https://`).
- Rejects protocol-relative URLs (`//evil.com`).
- Rejects backslash bypasses (`/\evil.com`) and javascript pseudo-protocols (`javascript:...`).

---

## 5. Required Negative Test Scenarios

The brief specifies three mandatory negative tests to demonstrate security guardrails:

### Negative Test 1: Signed-Out Write Attempt
- **Action:** An unauthenticated visitor attempts to call the booking creation API or trigger a booking mutation without an active session.
- **Expected Outcome:** The request is rejected with a `401 Unauthorized` / "Not signed in" response; no record is created in `bookings`.
- **Database Layer Protection:** RLS policy `bookings_insert_renter` checks `renter_id = auth.uid()`. Unauthenticated requests yield `auth.uid() IS NULL` and fail immediately.

### Negative Test 2: Cross-User Ownership Violation
- **Action:** User A signs in as a renter and attempts to cancel or modify a booking belonging to User B.
- **Expected Outcome:** The request is rejected with `403 Forbidden` / "Not yours"; no booking status changes occur.
- **Database Layer Protection:** RLS policy `bookings_update_parties_or_admin` ensures only `renter_id = auth.uid()` or `owner_id = auth.uid()` can modify the row.

### Negative Test 3: Unsafe Return URL Injection
- **Action:** A visitor accesses `/signin?next=https://example.com` and signs in.
- **Expected Outcome:** Upon sign-in, the application redirects safely to `/` or another verified internal path, never navigating to the external domain.
- **Implementation:** `safeReturnPath()` strips the external URL and returns the fallback route.

### Additional Ownership Checks Tested
- **Cross-Owner Car Mutation:** Owner 1 attempting to edit the daily price or details of Owner 2's vehicle by manipulating the ID in `/owner/cars/[id]/edit` is rejected with `403 Forbidden` via `cars_update_owner_or_admin`.
- **Private Booking Inspection:** Renter 1 cannot view Renter 2's booking summary at `/bookings/[id]`.
