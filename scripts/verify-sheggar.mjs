/**
 * Sheggar Wheels - Comprehensive Test & Security Verification Suite
 * Executes unit tests, negative security tests, and business logic assertions.
 */

import { formatETB, formatDate, calculateRentalDays } from "../lib/format.js";
import {
  isValidTransition,
  hasBookingConflict,
  calculateBookingTotals,
  getPermittedBookingActions,
} from "../lib/booking.js";
import {
  safeReturnPath,
  hasRole,
  canAccessBooking,
  canManageCar,
} from "../lib/auth-utils.js";
import { generateCSV } from "../lib/csv.js";

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

console.log("\n==========================================");
console.log("SHEGGAR WHEELS — VERIFICATION SUITE");
console.log("==========================================\n");

// 1. Formatting tests
console.log("1. Formatting & Currency Tests:");
assert(formatETB(2500) === "2,500 ETB", "formatETB formats standard integer");
assert(formatETB(0) === "0 ETB", "formatETB handles zero");
assert(calculateRentalDays("2026-11-01", "2026-11-04") === 3, "calculateRentalDays calculates 3 days");
assert(calculateRentalDays("2026-11-04", "2026-11-01") === 0, "calculateRentalDays handles backwards dates as 0");

// 2. Booking FSM & Lifecycle
console.log("\n2. Booking Finite State Machine (FSM):");
assert(isValidTransition("requested", "confirmed") === true, "Valid transition: requested -> confirmed");
assert(isValidTransition("requested", "declined") === true, "Valid transition: requested -> declined");
assert(isValidTransition("requested", "cancelled") === true, "Valid transition: requested -> cancelled");
assert(isValidTransition("requested", "completed") === false, "Invalid transition: requested cannot skip directly to completed");
assert(isValidTransition("confirmed", "in_progress") === true, "Valid transition: confirmed -> in_progress");
assert(isValidTransition("in_progress", "completed") === true, "Valid transition: in_progress -> completed");
assert(isValidTransition("completed", "reviewed") === true, "Valid transition: completed -> reviewed");
assert(isValidTransition("cancelled", "confirmed") === false, "Terminal state: cancelled cannot transition to confirmed");

// 3. Date Overlap & Conflict Detection
console.log("\n3. Date Overlap & Conflict Prevention:");
const sampleBookings = [
  { carId: "car-1", startDate: "2026-11-10", endDate: "2026-11-15", status: "confirmed" },
  { carId: "car-1", startDate: "2026-11-20", endDate: "2026-11-25", status: "cancelled" }, // cancelled dates released!
];

assert(hasBookingConflict(sampleBookings, "car-1", "2026-11-12", "2026-11-14") === true, "Detects overlapping date range inside active booking");
assert(hasBookingConflict(sampleBookings, "car-1", "2026-11-08", "2026-11-11") === true, "Detects start-overlap on active booking");
assert(hasBookingConflict(sampleBookings, "car-1", "2026-11-14", "2026-11-18") === true, "Detects end-overlap on active booking");
assert(hasBookingConflict(sampleBookings, "car-1", "2026-11-15", "2026-11-20") === false, "Allows adjacent booking starting exactly when previous ends");
assert(hasBookingConflict(sampleBookings, "car-1", "2026-11-21", "2026-11-24") === false, "Allows booking during dates of a cancelled booking (dates released)");
assert(hasBookingConflict(sampleBookings, "car-2", "2026-11-12", "2026-11-14") === false, "Different car on same dates does not conflict");

// 4. Financial Calculations & Price Snapshots
console.log("\n4. Financial Totals & 10% Marketplace Commission:");
const totals = calculateBookingTotals(2000, "2026-11-01", "2026-11-04");
assert(totals.days === 3, "3 rental days");
assert(totals.subtotal === 6000, "Subtotal is 6,000 ETB");
assert(totals.platformFee === 600, "Platform commission is exactly 10% (600 ETB)");
assert(totals.total === 6600, "Total is subtotal + platform fee (6,600 ETB)");

// 5. Negative Security Test #3: Open Redirect Attack Vectors
console.log("\n5. Negative Security Test #3 — Open Redirect Protection:");
assert(safeReturnPath("/cars", "/") === "/cars", "Allows safe relative path /cars");
assert(safeReturnPath("/checkout?carId=123", "/") === "/checkout?carId=123", "Allows safe relative path with params");
assert(safeReturnPath("//evil.com", "/") === "/", "REJECTS protocol-relative URL //evil.com");
assert(safeReturnPath("https://attacker.com", "/") === "/", "REJECTS external https URL");
assert(safeReturnPath("http://attacker.com", "/") === "/", "REJECTS external http URL");
assert(safeReturnPath("/\\attacker.com", "/") === "/", "REJECTS backslash traversal attack");
assert(safeReturnPath("/javascript:alert(1)", "/") === "/", "REJECTS pseudo-protocol injection");
assert(safeReturnPath(null, "/") === "/", "Handles null fallback");

// 6. Negative Security Test #2: Cross-User Authorization
console.log("\n6. Negative Security Test #2 — Authorization & Ownership:");
const renterA = { id: "renter-A", role: "renter", roles: ["renter"] };
const renterB = { id: "renter-B", role: "renter", roles: ["renter"] };
const ownerX = { id: "owner-X", role: "owner", roles: ["renter", "owner"] };
const ownerY = { id: "owner-Y", role: "owner", roles: ["renter", "owner"] };
const adminZ = { id: "admin-Z", role: "admin", roles: ["renter", "owner", "admin"] };

const bookingTest = { id: "b-1", renterId: "renter-A", ownerId: "owner-X" };
const carTest = { id: "car-1", ownerId: "owner-X" };

assert(canAccessBooking(renterA, bookingTest) === true, "Renter A can access their own booking");
assert(canAccessBooking(ownerX, bookingTest) === true, "Owner X can access booking for their car");
assert(canAccessBooking(adminZ, bookingTest) === true, "Admin Z can access any booking");
assert(canAccessBooking(renterB, bookingTest) === false, "REJECTS Renter B attempting to access Renter A's booking");
assert(canAccessBooking(ownerY, bookingTest) === false, "REJECTS Owner Y attempting to access Owner X's booking");

assert(canManageCar(ownerX, carTest) === true, "Owner X can manage their vehicle");
assert(canManageCar(adminZ, carTest) === true, "Admin Z can manage any vehicle");
assert(canManageCar(ownerY, carTest) === false, "REJECTS Owner Y attempting to manage Owner X's vehicle");
assert(canManageCar(renterA, carTest) === false, "REJECTS renter attempting to manage an owner vehicle");

// 7. Role Capability Checks
console.log("\n7. Role Capabilities:");
assert(hasRole(renterA, "renter") === true, "Renter has renter role");
assert(hasRole(renterA, "owner") === false, "Renter does NOT have owner role");
assert(hasRole(renterA, "admin") === false, "Renter does NOT have admin role");
assert(hasRole(ownerX, "owner") === true, "Owner has owner role");
assert(hasRole(ownerX, "renter") === true, "Owner also has renter role");
assert(hasRole(adminZ, "admin") === true, "Admin has admin role");

// 8. RFC 4180 CSV Export Generation
console.log("\n8. RFC 4180 CSV Generator & Escaping:");
const csvData = [
  { id: "1", note: 'Normal, "Quoted" and\nNewline' },
];
const csvResult = generateCSV(csvData);
assert(csvResult.includes('"Normal, ""Quoted"" and\nNewline"'), "Correctly escapes quotes, commas, and newlines in CSV");

console.log("\n==========================================");
console.log(`SUMMARY: ${passed} passed, ${failed} failed`);
console.log("==========================================\n");

if (failed > 0) {
  process.exit(1);
}
