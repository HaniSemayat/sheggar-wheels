/**
 * Sheggar Wheels - Formatting & Localization Utilities
 * Standardized Ethiopian Birr (ETB), date, and relative-time formatters.
 * Conforms to 43-concept checklist item #32.
 */

/**
 * Format a numeric amount into Ethiopian Birr (ETB) display string.
 * @param {number|string} amount
 * @returns {string} E.g., "2,500 ETB"
 */
export function formatETB(amount) {
  const numeric = Number(amount) || 0;
  return `${numeric.toLocaleString("en-ET", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })} ETB`;
}

/**
 * Format an ISO string or YYYY-MM-DD date into localized human-readable text.
 * @param {string|Date} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string} E.g., "12 Oct 2026"
 */
export function formatDate(value, options = {}) {
  if (!value) return "Not specified";

  // For YYYY-MM-DD strings, append time to avoid UTC day-shift
  const dateStr = typeof value === "string" && value.length === 10
    ? `${value}T00:00:00`
    : value;

  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Invalid date";

  const defaultOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  };

  return date.toLocaleDateString("en-ET", defaultOptions);
}

/**
 * Format a start and end date range into a concise string.
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {string} E.g., "10 Oct 2026 – 12 Oct 2026 (2 days)"
 */
export function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return "Dates pending";

  const startFormatted = formatDate(startDate);
  const endFormatted = formatDate(endDate);
  const days = calculateRentalDays(startDate, endDate);

  const dayLabel = days === 1 ? "1 day" : `${days} days`;
  return `${startFormatted} – ${endFormatted} (${dayLabel})`;
}

/**
 * Calculate full rental days between two dates.
 * Follows the standard day calculation [start, end).
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {number}
 */
export function calculateRentalDays(startDate, endDate) {
  if (!startDate || !endDate || endDate <= startDate) return 0;

  const start = new Date(typeof startDate === "string" && startDate.length === 10 ? `${startDate}T00:00:00` : startDate);
  const end = new Date(typeof endDate === "string" && endDate.length === 10 ? `${endDate}T00:00:00` : endDate);

  const diffMs = end.getTime() - start.getTime();
  if (diffMs <= 0) return 0;

  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a timestamp into human-friendly relative time (e.g., "3 days ago", "just now").
 * @param {string|Date} value
 * @returns {string}
 */
export function formatRelativeTime(value) {
  if (!value) return "Recently";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";

  const now = new Date();
  const diffSeconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 45) return "Just now";
  if (diffSeconds < 90) return "1 minute ago";

  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 45) return `${diffMinutes} minutes ago`;
  if (diffMinutes < 90) return "1 hour ago";

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffHours < 48) return "Yesterday";

  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays} days ago`;

  const diffMonths = Math.round(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} months ago`;

  return formatDate(value);
}
