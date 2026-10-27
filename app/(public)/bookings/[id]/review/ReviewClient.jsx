"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, CheckCircle2, AlertCircle } from "lucide-react";
import { getBookings, getCars, getReviews } from "../../../../../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../../../../../lib/storage";
import { submitCarReview } from "../../../../../lib/data-service";
import { isSupabaseConfigured, getBrowserSupabaseClient } from "../../../../../lib/supabase/client";

export default function ReviewClient({ id }) {
  const router = useRouter();
  const [booking, setBooking] = useState(null);
  const [car, setCar] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const activeUser = JSON.parse(
        window.localStorage.getItem("sw_current_user_v1") || "null"
      );
      setCurrentUser(activeUser);

      const allBookings = getBookings();
      const b = allBookings.find((item) => item.id === id);
      setBooking(b || null);

      if (b) {
        const c = getCars().find((item) => item.id === b.carId);
        setCar(c || null);
      }
    } catch {
      //
    }
    setReady(true);
  }, [id]);

  async function handleSubmitReview(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!currentUser) {
      setErrorMsg("Please sign in before submitting a review.");
      return;
    }

    if (comment.trim().length < 8) {
      setErrorMsg("Review comment must be at least 8 characters long.");
      return;
    }

    setSubmitting(true);

    try {
      // Use unified data service
      await submitCarReview({
        carId: booking.carId,
        bookingId: booking.id,
        renterId: currentUser.id,
        rating,
        comment: comment.trim(),
      });

      // Update Supabase if configured
      if (isSupabaseConfigured()) {
        const supabase = getBrowserSupabaseClient();
        if (supabase) {
          try {
            await supabase.from("reviews").insert({
              booking_id: booking.id,
              car_id: booking.carId,
              renter_id: currentUser.id,
              owner_id: booking.ownerId,
              rating,
              comment: comment.trim(),
            });
          } catch (err) {
            console.warn("Supabase review insert notice:", err);
          }
        }
      }

      setSubmitted(true);
    } catch (err) {
      setErrorMsg(err.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading review portal…</div>;
  }

  if (!booking) {
    return (
      <div style={{ maxWidth: "600px", margin: "64px auto", padding: "0 20px", textAlign: "center" }}>
        <h2>Booking Not Found</h2>
        <p>This booking record could not be located.</p>
        <Link href="/my-bookings" style={{ color: "var(--color-brand)" }}>Return to My Bookings</Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{ maxWidth: "600px", margin: "64px auto", padding: "32px", background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", textAlign: "center" }}>
        <CheckCircle2 size={54} color="#16a34a" style={{ marginBottom: "16px" }} />
        <h2>Thank You for Your Feedback!</h2>
        <p style={{ color: "var(--color-text-muted, #6b7280)", marginBottom: "24px" }}>
          Your review for the {car ? `${car.year} ${car.make} ${car.model}` : "vehicle"} has been published.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link href={car ? `/cars/${car.id}` : "/cars"} style={{ background: "var(--color-brand)", color: "white", padding: "12px 20px", borderRadius: "8px", textDecoration: "none", fontWeight: 600 }}>
            View Car Listing
          </Link>
          <Link href="/my-bookings" style={{ border: "1px solid var(--color-border)", padding: "12px 20px", borderRadius: "8px", textDecoration: "none", color: "var(--color-text)", fontWeight: 600 }}>
            My Bookings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "680px", margin: "48px auto", padding: "0 20px" }}>
      <Link href={`/bookings/${id}`} style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--color-brand)", textDecoration: "none", fontWeight: 600, marginBottom: "20px" }}>
        <ArrowLeft size={16} /> Back to booking details
      </Link>

      <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
        <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand)", letterSpacing: "0.1em", margin: "0 0 6px" }}>
          RATE YOUR EXPERIENCE
        </p>
        <h1 style={{ fontSize: "26px", margin: "0 0 8px" }}>
          Review Your Rental
        </h1>
        <p style={{ color: "var(--color-text-muted, #6b7280)", margin: "0 0 24px" }}>
          {car ? `${car.year} ${car.make} ${car.model} · Picked up in ${car.location}` : "Your recent rental"}
        </p>

        <form onSubmit={handleSubmitReview}>
          {/* Star selector */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
              Overall Rating:
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  aria-label={`Rate ${star} out of 5 stars`}
                >
                  <Star
                    size={32}
                    fill={(hoverRating || rating) >= star ? "#f59e0b" : "none"}
                    color={(hoverRating || rating) >= star ? "#f59e0b" : "#d1d5db"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 700, marginBottom: "8px" }}>
              Your Review & Comments (minimum 8 characters):
            </label>
            <textarea
              style={{
                width: "100%",
                minHeight: "120px",
                padding: "14px",
                borderRadius: "8px",
                border: "1px solid var(--color-border, #d1d5db)",
                fontFamily: "inherit",
                fontSize: "15px",
                boxSizing: "border-box",
              }}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell other drivers about the vehicle condition, pickup experience in Addis Ababa, and cleanliness..."
              required
              minLength={8}
            />
          </div>

          {errorMsg && (
            <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "#dc2626", background: "#fef2f2", padding: "12px", borderRadius: "8px", marginBottom: "20px" }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: "100%",
              background: "var(--color-brand)",
              color: "white",
              padding: "14px",
              borderRadius: "8px",
              border: "none",
              fontSize: "16px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {submitting ? "Submitting review..." : "Submit Verified Review"}
          </button>
        </form>
      </div>
    </div>
  );
}
