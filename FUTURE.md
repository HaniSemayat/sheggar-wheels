# Sheggar Wheels — Future Work & Production Roadmap (`FUTURE.md`)

This document honestly outlines the boundaries of the demonstration project, architectural simplifications made, and the prioritized roadmap required to transition **Sheggar Wheels** into a commercial, production-ready car rental marketplace in Ethiopia.

---

## 1. What is Real vs. What is Simulated

| Capability | Demonstration State | Commercial Production Requirement |
|---|---|---|
| **Data Persistence** | **Real** (PostgreSQL / Supabase with RLS) | Real multi-region replicated PostgreSQL database. |
| **Authentication** | **Real** (Supabase Auth sessions & cookies) | Multi-Factor Authentication (MFA / SMS OTP for Ethiopian phone numbers). |
| **Booking Overlap Prevention** | **Real** (PostgreSQL GiST `EXCLUDE` constraint) | Concurrency-safe distributed locking with payment timeout reserves. |
| **Payment Processing** | **Simulated** (Mock TeleBirr with transaction references) | Real payment gateway integration with TeleBirr API, CBE Birr, Chapa, or Awash Bank. |
| **Trip Tracking** | **Simulated** (Seeded Addis Ababa GPS coordinates) | Hardware IoT telemetry units with driver consent, tamper alerts, and speed telemetry. |
| **Notifications** | **Simulated** (In-app badge updates & state changes) | Real-time push notifications, transactional SMS (Ethio Telecom), and transactional email. |
| **Driver Identity Verification** | **Simulated** (Self-declared user name & phone) | Government ID (Fayda / National ID) and driving license verification against Transport Authority records. |

---

## 2. Technical Limitations & Deliberate Simplifications

1. **Payment Simulation:**
   No real financial credentials, debit card numbers, or mobile wallet PINs are ever requested or stored. The mock payment interface generates randomized transaction references (e.g., `TB-2026-XXXX`) for demonstration only.
2. **Vehicle Damage & Security Deposits:**
   Security deposits and vehicle condition inspection checklists (pre-trip and post-trip photo submissions) are modelled as domain workflows but require automated escrow holds in commercial production.
3. **Real-Time Synchronization (SSE / WebSockets):**
   Real-time multi-tab synchronization currently uses storage events and SWR polling. Production deployment will integrate Supabase Realtime (Postgres CDC WebSockets) for instant owner alerts upon booking creation.

---

## 3. Prioritized Production Roadmap

### Phase 1: Payment Gateway Integration
- Integrate Chapa / TeleBirr Merchant API with webhook callbacks.
- Implement two-step payment capture: authorization hold upon booking request, actual capture upon owner approval, and automatic release if declined.

### Phase 2: Ethiopian Identity & License Verification
- Integration with National ID (Fayda) verification services.
- Mandatory photo upload and manual/AI validation of Ethiopian Driver's Licenses before first booking.

### Phase 3: Vehicle Telematics & Geofencing
- Hardware GPS integration via OBD-II telematics devices.
- Addis Ababa city boundary geofence alerts and automated mileage tracking for excess mileage billing.

### Phase 4: Insurance & Commercial Contracts
- Partnership with Ethiopian insurance underwriters (e.g., Ethiopian Insurance Corporation / Nyala Insurance).
- Automated digital contract generation with legal timestamping before vehicle handover.
