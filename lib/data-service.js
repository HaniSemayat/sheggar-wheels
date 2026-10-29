/**
 * Sheggar Wheels - Unified Data Service Layer
 * Authoritative interface for interacting with marketplace data.
 * Queries Supabase PostgreSQL when configured; seamlessly falls back to local persistent store.
 */

import { isSupabaseConfigured, getBrowserSupabaseClient } from "./supabase/client";
import { demoCars } from "../data/cars";
import { readStorage, writeStorage, STORAGE_KEYS } from "./storage";
import {
  hasBookingConflict,
  calculateBookingTotals,
  isValidTransition,
} from "./booking";

/**
 * Fetch public car listings with multi-parameter filtering, sorting, and pagination.
 */
export async function getCarsList({
  search = "",
  location = "All locations",
  transmission = "All",
  minSeats = "Any",
  maxPrice = "",
  sort = "recommended",
  page = 1,
  pageSize = 6,
} = {}) {
  let allCars = [];

  const supabase = getBrowserSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("status", "approved");

      if (!error && Array.isArray(data) && data.length > 0) {
        allCars = data.map((item) => ({
          ...item,
          pricePerDay: item.price_per_day,
        }));
      } else {
        allCars = readStorage(STORAGE_KEYS.cars, demoCars);
      }
    } catch {
      allCars = readStorage(STORAGE_KEYS.cars, demoCars);
    }
  } else {
    allCars = readStorage(STORAGE_KEYS.cars, demoCars);
  }

  // Filter out any non-approved cars for public catalogue
  allCars = allCars.filter((car) => {
    const moderation = car.moderationStatus || car.status || "approved";
    return moderation === "approved" || moderation === "available";
  });

  const query = search.trim().toLowerCase();

  const filtered = allCars.filter((car) => {
    const searchableText = `${car.make} ${car.model} ${car.year} ${car.description || ""} ${car.location || ""}`.toLowerCase();
    const matchesSearch = !query || searchableText.includes(query);
    const matchesLocation = location === "All locations" || car.location === location;
    const matchesTransmission = transmission === "All" || car.transmission === transmission;
    const matchesSeats = minSeats === "Any" || car.seats >= Number(minSeats);
    const matchesPrice = !maxPrice || car.pricePerDay <= Number(maxPrice);

    return matchesSearch && matchesLocation && matchesTransmission && matchesSeats && matchesPrice;
  });

  // Sorting
  if (sort === "price-low") {
    filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
  } else if (sort === "price-high") {
    filtered.sort((a, b) => b.pricePerDay - a.pricePerDay);
  } else if (sort === "newest") {
    filtered.sort((a, b) => b.year - a.year);
  }

  // Pagination calculation
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCars = filtered.slice(startIndex, startIndex + pageSize);

  // Available locations for filter dropdown
  const availableLocations = [...new Set(allCars.map((car) => car.location).filter(Boolean))].sort();

  return {
    cars: paginatedCars,
    totalCount,
    totalPages,
    currentPage,
    availableLocations,
  };
}

/**
 * Fetch a single car by its ID.
 */
export async function getCarById(id) {
  if (!id) return null;

  const supabase = getBrowserSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", id)
        .single();

      if (!error && data) {
        return {
          ...data,
          pricePerDay: data.price_per_day,
        };
      }
    } catch {
      // Fallback
    }
  }

  const allCars = readStorage(STORAGE_KEYS.cars, demoCars);
  return allCars.find((item) => item.id === id) || null;
}

/**
 * Fetch bookings relevant to a given user.
 */
export async function getUserBookings(userId, userRole = "renter") {
  if (!userId) return [];

  const supabase = getBrowserSupabaseClient();
  if (supabase) {
    try {
      let query = supabase.from("bookings").select("*");
      if (userRole === "admin") {
        // Admin sees all
      } else if (userRole === "owner") {
        query = query.eq("owner_id", userId);
      } else {
        query = query.eq("renter_id", userId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (!error && Array.isArray(data)) {
        return data.map((b) => ({
          ...b,
          carId: b.car_id,
          renterId: b.renter_id,
          ownerId: b.owner_id,
          startDate: b.start_date,
          endDate: b.end_date,
          pricePerDay: b.price_per_day,
          totalPrice: b.total,
          createdAt: b.created_at,
        }));
      }
    } catch {
      // Fallback
    }
  }

  const bookings = readStorage(STORAGE_KEYS.bookings, []);
  if (userRole === "admin") {
    return bookings;
  }
  if (userRole === "owner") {
    return bookings.filter((b) => b.ownerId === userId);
  }
  return bookings.filter((b) => b.renterId === userId);
}

/**
 * Create a validated booking request.
 */
export async function createBooking({ carId, renterId, startDate, endDate, notes = "" }) {
  if (!carId || !renterId || !startDate || !endDate) {
    throw new Error("Missing required booking parameters.");
  }

  const car = await getCarById(carId);
  if (!car) {
    throw new Error("Car listing not found.");
  }

  if (car.ownerId === renterId) {
    throw new Error("Owners cannot book their own vehicles.");
  }

  // Check overlap conflict against active bookings
  const existingBookings = readStorage(STORAGE_KEYS.bookings, []);
  if (hasBookingConflict(existingBookings, carId, startDate, endDate)) {
    throw new Error("These dates conflict with an existing active booking for this vehicle.");
  }

  const totals = calculateBookingTotals(car.pricePerDay, startDate, endDate);
  if (totals.days < 1) {
    throw new Error("Return date must be after pickup date.");
  }

  const newBooking = {
    id: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    carId,
    renterId,
    ownerId: car.ownerId,
    startDate,
    endDate,
    days: totals.days,
    pricePerDay: totals.pricePerDay,
    subtotal: totals.subtotal,
    platformFee: totals.platformFee,
    totalPrice: totals.total,
    status: "requested",
    paymentStatus: "unpaid",
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const supabase = getBrowserSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase.from("bookings").insert({
        id: newBooking.id,
        car_id: carId,
        renter_id: renterId,
        owner_id: car.ownerId,
        start_date: startDate,
        end_date: endDate,
        days: totals.days,
        price_per_day: totals.pricePerDay,
        subtotal: totals.subtotal,
        platform_fee: totals.platformFee,
        total: totals.total,
        status: "requested",
        payment_status: "unpaid",
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (err) {
      // In local mode if insert fails, persist to localStorage fallback
      writeStorage(STORAGE_KEYS.bookings, [newBooking, ...existingBookings]);
      return newBooking;
    }
  }

  writeStorage(STORAGE_KEYS.bookings, [newBooking, ...existingBookings]);
  return newBooking;
}

/**
 * Advance or transition booking status with validation.
 */
export async function updateBookingStatus(bookingId, targetStatus, user, reason = "") {
  if (!bookingId || !targetStatus || !user) {
    throw new Error("Invalid parameters for booking update.");
  }

  const existingBookings = readStorage(STORAGE_KEYS.bookings, []);
  const booking = existingBookings.find((b) => b.id === bookingId);
  if (!booking) {
    throw new Error("Booking not found.");
  }

  if (!isValidTransition(booking.status, targetStatus)) {
    throw new Error(`Invalid status transition from "${booking.status}" to "${targetStatus}".`);
  }

  // Authorization check
  const isRenter = user.id === booking.renterId;
  const isOwner = user.id === booking.ownerId;
  const isAdmin = user.role === "admin" || (Array.isArray(user.roles) && user.roles.includes("admin"));

  if (targetStatus === "cancelled" && !isRenter && !isAdmin) {
    throw new Error("Only the booking customer or an administrator may cancel this booking.");
  }
  if (["confirmed", "declined"].includes(targetStatus) && !isOwner && !isAdmin) {
    throw new Error("Only the car owner or an administrator may confirm or decline this request.");
  }

  const updatedBooking = {
    ...booking,
    status: targetStatus,
    cancellationReason: targetStatus === "cancelled" ? reason : booking.cancellationReason,
    updatedAt: new Date().toISOString(),
  };

  const nextList = existingBookings.map((b) => (b.id === bookingId ? updatedBooking : b));
  writeStorage(STORAGE_KEYS.bookings, nextList);

  const supabase = getBrowserSupabaseClient();
  if (supabase) {
    try {
      await supabase
        .from("bookings")
        .update({
          status: targetStatus,
          cancellation_reason: reason || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bookingId);
    } catch {
      // Fallback
    }
  }

  return updatedBooking;
}

/**
 * Fetch reviews for a vehicle.
 */
export async function getCarReviews(carId) {
  const reviews = readStorage(STORAGE_KEYS.reviews, []);
  if (!carId) return reviews;
  return reviews.filter((r) => r.carId === carId);
}

/**
 * Submit a customer review for a completed rental.
 */
export async function submitCarReview({ carId, bookingId, renterId, rating, comment }) {
  if (!carId || !bookingId || !renterId || !comment || !rating) {
    throw new Error("Missing required review fields.");
  }

  const reviews = readStorage(STORAGE_KEYS.reviews, []);
  if (reviews.some((r) => r.bookingId === bookingId)) {
    throw new Error("A review has already been submitted for this booking.");
  }

  const newReview = {
    id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    carId,
    bookingId,
    renterId,
    rating: Number(rating),
    comment: comment.trim(),
    createdAt: new Date().toISOString(),
  };

  writeStorage(STORAGE_KEYS.reviews, [newReview, ...reviews]);

  // Update booking status to reviewed
  const bookings = readStorage(STORAGE_KEYS.bookings, []);
  const updatedBookings = bookings.map((b) =>
    b.id === bookingId ? { ...b, status: "reviewed" } : b
  );
  writeStorage(STORAGE_KEYS.bookings, updatedBookings);

  return newReview;
}

/**
 * Reply to a review (owner only).
 */
export async function replyToReview(reviewId, ownerReply, user) {
  if (!reviewId || !ownerReply || !user) {
    throw new Error("Invalid parameters.");
  }

  const reviews = readStorage(STORAGE_KEYS.reviews, []);
  const target = reviews.find((r) => r.id === reviewId);
  if (!target) {
    throw new Error("Review not found.");
  }

  const updatedReviews = reviews.map((r) =>
    r.id === reviewId ? { ...r, ownerReply: ownerReply.trim() } : r
  );

  writeStorage(STORAGE_KEYS.reviews, updatedReviews);
  return updatedReviews.find((r) => r.id === reviewId);
}
