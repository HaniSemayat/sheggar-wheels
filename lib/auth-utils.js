/**
 * Sheggar Wheels - Authentication & Authorization Utilities
 * Provides safe return navigation and role/ownership checks.
 * Directly fulfills 43-concept checklist items #9, #10, and Negative Test #3.
 */

/**
 * Validates a return redirect path to protect against Open Redirect vulnerabilities.
 * Ensures the target URL is strictly an internal, relative application route.
 * Rejects external protocols (http:, https:), protocol-relative URLs (//evil.com),
 * javascript: pseudo-protocols, and backslash directory traversal tricks.
 *
 * @param {string|null|undefined} targetPath
 * @param {string} [fallback="/"]
 * @returns {string} Safe relative internal path
 */
export function safeReturnPath(targetPath, fallback = "/") {
  if (!targetPath || typeof targetPath !== "string") {
    return fallback;
  }

  const trimmed = targetPath.trim();

  // Must begin with a single forward slash and not two slashes (//)
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return fallback;
  }

  // Reject backslashes which some browsers normalize to forward slashes
  if (trimmed.includes("\\")) {
    return fallback;
  }

  // Reject colon characters to prevent protocol injection (e.g. /javascript:...)
  if (trimmed.includes(":")) {
    return fallback;
  }

  // Reject control characters or newlines
  if (/[\r\n\t]/.test(trimmed)) {
    return fallback;
  }

  return trimmed;
}

/**
 * Check whether a user object possesses a given capability/role.
 * Supports both modern array schema `roles: ['renter', 'owner']` and legacy string `role: 'owner'`.
 *
 * @param {Object|null|undefined} user
 * @param {string} role - 'renter', 'owner', or 'admin'
 * @returns {boolean}
 */
export function hasRole(user, role) {
  if (!user || !role) return false;

  // Modern array-based roles check
  if (Array.isArray(user.roles)) {
    return user.roles.includes(role);
  }

  // Fallback string-based role check
  if (typeof user.role === "string") {
    if (user.role === role) return true;
    // Admins implicitly have renter and owner access for moderation
    if (user.role === "admin") return true;
  }

  return false;
}

/**
 * Check if the user is permitted to view or manage a booking record.
 * Renter must match renterId, owner must match ownerId, or user is admin.
 *
 * @param {Object} user
 * @param {Object} booking
 * @returns {boolean}
 */
export function canAccessBooking(user, booking) {
  if (!user || !booking) return false;
  if (hasRole(user, "admin")) return true;

  return user.id === booking.renterId || user.id === booking.ownerId;
}

/**
 * Check if the user is authorized to edit or update a car listing.
 *
 * @param {Object} user
 * @param {Object} car
 * @returns {boolean}
 */
export function canManageCar(user, car) {
  if (!user || !car) return false;
  if (hasRole(user, "admin")) return true;

  return user.id === car.ownerId;
}
