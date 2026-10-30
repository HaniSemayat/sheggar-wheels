/**
 * Sheggar Wheels - Booking Lifecycle & Domain Rules
 * Source of truth for booking finite state machine transitions, pricing calculations,
 * and conflict-detection domain logic.
 */

import { calculateRentalDays } from "./format.js";

export const BOOKING_STATUSES = {
  REQUESTED: "requested",
  CONFIRMED: "confirmed",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  REVIEWED: "reviewed",
  DECLINED: "declined",
  CANCELLED: "cancelled",
  DISPUTED: "disputed",
  RESOLVED: "resolved",
};

export const STATUS_LABELS = {
  requested: "Awaiting confirmation",
  pending: "Awaiting confirmation", // Legacy alias compatibility
  confirmed: "Confirmed",
  in_progress: "Rental in progress",
  completed: "Completed",
  reviewed: "Completed & reviewed",
  declined: "Declined",
  rejected: "Declined", // Legacy alias compatibility
  cancelled: "Cancelled",
  disputed: "Under dispute",
  resolved: "Dispute resolved",
};

/**
 * Valid FSM transitions mapped by [currentStatus] -> Array of permitted next statuses.
 */
export const ALLOWED_TRANSITIONS = {
  requested: ["confirmed", "declined", "cancelled"],
  pending: ["confirmed", "declined", "cancelled"], // Legacy fallback
  confirmed: ["in_progress", "cancelled"],
  in_progress: ["completed", "disputed"],
  completed: ["reviewed", "disputed"],
  disputed: ["resolved"],
  reviewed: [], // Terminal
  declined: [], // Terminal
  rejected: [], // Terminal
  cancelled: [], // Terminal
  resolved: [], // Terminal
};

/**
 * Validates whether a state transition is permitted by the lifecycle rules.
 * @param {string} currentStatus
 * @param {string} nextStatus
 * @returns {boolean}
 */
export function isValidTransition(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) return false;
  if (currentStatus === nextStatus) return true;

  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  return allowed.includes(nextStatus);
}

/**
 * Checks if two date ranges [startA, endA) and [startB, endB) overlap.
 * Uses standard half-open interval comparison.
 * @param {string} startA
 * @param {string} endA
 * @param {string} startB
 * @param {string} endB
 * @returns {boolean}
 */
export function doDatesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Check if requested dates conflict with any existing active booking for a vehicle.
 * Active statuses: requested, pending, confirmed, in_progress.
 * Terminal/inactive statuses (declined, cancelled, completed, reviewed, resolved) do NOT conflict.
 * @param {Array} bookings
 * @param {string} carId
 * @param {string} startDate
 * @param {string} endDate
 * @param {string} [excludeBookingId] - Optional booking ID to exclude (for updates)
 * @returns {boolean}
 */
export function hasBookingConflict(bookings, carId, startDate, endDate, excludeBookingId = null) {
  if (!Array.isArray(bookings) || !carId || !startDate || !endDate) return false;

  const activeStatuses = ["requested", "pending", "confirmed", "in_progress"];

  return bookings.some((booking) => {
    if (booking.id === excludeBookingId) return false;
    if (booking.carId !== carId) return false;
    if (!activeStatuses.includes(booking.status)) return false;

    return doDatesOverlap(startDate, endDate, booking.startDate, booking.endDate);
  });
}

/**
 * Calculate authoritative booking financial totals.
 * @param {number|string} pricePerDay
 * @param {string} startDate
 * @param {string} endDate
 * @returns {{ days: number, pricePerDay: number, subtotal: number, platformFee: number, total: number }}
 */
export function calculateBookingTotals(pricePerDay, startDate, endDate) {
  const dailyRate = Math.max(0, Number(pricePerDay) || 0);
  const days = calculateRentalDays(startDate, endDate);

  const subtotal = days * dailyRate;
  const platformFee = Math.round(subtotal * 0.10); // 10% platform service fee
  const total = subtotal + platformFee;

  return {
    days,
    pricePerDay: dailyRate,
    subtotal,
    platformFee,
    total,
  };
}

/**
 * Determine what actions a given user can perform on a booking record.
 * @param {Object} booking
 * @param {Object} user
 * @returns {{ canCancel: boolean, canApprove: boolean, canDecline: boolean, canReview: boolean, canDispute: boolean }}
 */
export function getPermittedBookingActions(booking, user) {
  const defaultActions = {
    canCancel: false,
    canApprove: false,
    canDecline: false,
    canReview: false,
    canDispute: false,
  };

  if (!booking || !user) return defaultActions;

  const isRenter = user.id === booking.renterId;
  const isOwner = user.id === booking.ownerId;
  const isAdmin = Array.isArray(user.roles)
    ? user.roles.includes("admin")
    : user.role === "admin";

  const status = booking.status;

  return {
    // Renter can cancel if requested or confirmed
    canCancel: (isRenter && ["requested", "pending", "confirmed"].includes(status)) || isAdmin,

    // Owner can approve or decline if requested
    canApprove: (isOwner && ["requested", "pending"].includes(status)) || isAdmin,
    canDecline: (isOwner && ["requested", "pending"].includes(status)) || isAdmin,

    // Renter can review if completed and not yet reviewed
    canReview: isRenter && status === "completed",

    // Involved parties can raise dispute while in progress or completed
    canDispute: (isRenter || isOwner) && ["in_progress", "completed"].includes(status),
  };
}
