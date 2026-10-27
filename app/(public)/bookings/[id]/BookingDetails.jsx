"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CarFront,
  Clock3,
  Navigation,
  Star,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { getBookings, getCars } from "../../../../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../../../../lib/storage";
import { canAccessBooking, hasRole } from "../../../../lib/auth-utils";
import { isSupabaseConfigured, getBrowserSupabaseClient } from "../../../../lib/supabase/client";
import styles from "./BookingDetails.module.css";

const money = (amount) =>
  `${Number(amount || 0).toLocaleString("en-ET")} ETB`;

const dateLabel = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-ET", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not specified";

const labels = {
  pending: "Awaiting response",
  requested: "Awaiting response",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  completed: "Completed",
  reviewed: "Reviewed",
  cancelled: "Cancelled",
  rejected: "Declined",
  declined: "Declined",
  disputed: "Disputed",
  resolved: "Resolved",
};

export default function BookingDetails({ id }) {
  const [booking, setBooking] = useState(null);
  const [car, setCar] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    const refresh = () => {
      let activeUser = null;

      try {
        activeUser = JSON.parse(
          window.localStorage.getItem("sw_current_user_v1") || "null"
        );
      } catch {
        activeUser = null;
      }

      const allBookings = getBookings();
      const found = allBookings.find((item) => item.id === id);

      setUser(activeUser);
      setBooking(found || null);
      setCar(found ? getCars().find((item) => item.id === found.carId) || null : null);
      setReady(true);
    };

    refresh();
    window.addEventListener("sheggar-storage-change", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("sheggar-storage-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [id]);

  function handleCancelBooking(e) {
    e.preventDefault();
    if (!booking) return;

    const allBookings = getBookings();
    const updated = allBookings.map((b) =>
      b.id === booking.id
        ? {
            ...b,
            status: "cancelled",
            cancellationReason: cancelReason || "Cancelled by renter",
            updatedAt: new Date().toISOString(),
          }
        : b
    );

    writeStorage(STORAGE_KEYS.bookings, updated);

    if (isSupabaseConfigured()) {
      const supabase = getBrowserSupabaseClient();
      if (supabase) {
        supabase
          .from("bookings")
          .update({
            status: "cancelled",
            cancellation_reason: cancelReason || "Cancelled by renter",
          })
          .eq("id", booking.id)
          .then();
      }
    }

    setBooking((prev) => ({
      ...prev,
      status: "cancelled",
      cancellationReason: cancelReason || "Cancelled by renter",
    }));
    setCancelModal(false);
    setActionMsg("Booking successfully cancelled. The reserved dates have been released.");
  }

  if (!ready) {
    return (
      <main className={styles.page}>
        <p style={{ textAlign: "center", padding: "48px 0" }}>Loading booking details…</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1>Sign in required</h1>
          <p>Please sign in to view this booking record.</p>
          <Link href="/signin" className={styles.button}>Sign in</Link>
        </section>
      </main>
    );
  }

  if (!booking || !canAccessBooking(user, booking)) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1>Booking not found</h1>
          <p>This booking does not exist or does not belong to your account.</p>
          <Link href="/my-bookings" className={styles.backLink}>
            <ArrowLeft size={17} /> Back to my bookings
          </Link>
        </section>
      </main>
    );
  }

  const status = booking.status || "pending";
  const canCancel = ["pending", "requested", "confirmed"].includes(status);
  const canTrack = ["confirmed", "in_progress"].includes(status);
  const canReview = status === "completed";

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/my-bookings" className={styles.backLink}>
          <ArrowLeft size={17} /> Back to my bookings
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>BOOKING OVERVIEW</p>
          <h1>Booking details</h1>
          <p>Reference: {booking.id}</p>
          <span className={`${styles.status} ${styles[status] || ""}`}>
            {labels[status] || status}
          </span>
        </header>

        {actionMsg && (
          <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", padding: "14px 18px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
            {actionMsg}
          </div>
        )}

        {/* Action Bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
          {canTrack && (
            <Link
              href={`/bookings/${booking.id}/track`}
              className={styles.button}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
            >
              <Navigation size={17} />
              Simulated Trip Tracking
            </Link>
          )}

          {canReview && (
            <Link
              href={`/bookings/${booking.id}/review`}
              className={styles.button}
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "#d97706" }}
            >
              <Star size={17} />
              Leave a Review
            </Link>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={() => setCancelModal(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 16px",
                borderRadius: "8px",
                background: "#fef2f2",
                border: "1px solid #ef4444",
                color: "#dc2626",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <XCircle size={17} />
              Cancel Booking
            </button>
          )}
        </div>

        {/* Cancel Modal */}
        {cancelModal && (
          <div style={{ background: "var(--color-surface)", border: "2px solid #ef4444", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
            <h3 style={{ margin: "0 0 10px", color: "#dc2626" }}>Cancel this reservation?</h3>
            <p style={{ margin: "0 0 16px", color: "var(--color-text-muted)", fontSize: "14px" }}>
              Are you sure? Active dates will be released and made available for other renters.
            </p>
            <form onSubmit={handleCancelBooking}>
              <label style={{ display: "block", marginBottom: "16px", fontSize: "14px", fontWeight: 600 }}>
                Reason for cancellation:
                <textarea
                  style={{ width: "100%", padding: "10px", marginTop: "6px", borderRadius: "6px", border: "1px solid var(--color-border)", minHeight: "80px" }}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Travel schedule changed..."
                  required
                />
              </label>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="submit"
                  style={{ background: "#dc2626", color: "white", padding: "10px 18px", border: "none", borderRadius: "6px", fontWeight: 600, cursor: "pointer" }}
                >
                  Confirm Cancellation
                </button>
                <button
                  type="button"
                  onClick={() => setCancelModal(false)}
                  style={{ background: "transparent", border: "1px solid var(--color-border)", padding: "10px 18px", borderRadius: "6px", cursor: "pointer" }}
                >
                  Keep Booking
                </button>
              </div>
            </form>
          </div>
        )}

        <section className={styles.card}>
          <div className={styles.sectionTitle}>
            <CarFront size={22} />
            <h2>Your vehicle</h2>
          </div>
          <h3>{car ? `${car.year} ${car.make} ${car.model}` : "Vehicle listing"}</h3>
          <p>{car?.location || "Addis Ababa"}</p>
          {car && (
            <Link href={`/cars/${car.id}`} className={styles.button}>
              View vehicle listing
            </Link>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.sectionTitle}>
            <CalendarDays size={22} />
            <h2>Rental schedule & Pricing</h2>
          </div>
          <div className={styles.grid}>
            <div><span>Pickup date</span><strong>{dateLabel(booking.startDate)}</strong></div>
            <div><span>Return date</span><strong>{dateLabel(booking.endDate)}</strong></div>
            <div><span>Daily rate</span><strong>{money(booking.pricePerDay ?? car?.pricePerDay)}</strong></div>
            <div><span>Total rental price</span><strong>{money(booking.totalPrice || booking.total)}</strong></div>
          </div>
          {booking.paymentStatus && (
            <p style={{ marginTop: "14px", fontSize: "14px", color: "var(--color-text-muted)" }}>
              Payment status: <strong style={{ color: booking.paymentStatus === "demo_paid" ? "#16a34a" : "inherit" }}>{booking.paymentStatus}</strong>
              {booking.telebirrReference && ` · TeleBirr Ref: ${booking.telebirrReference}`}
            </p>
          )}
          {booking.cancellationReason && (
            <p style={{ marginTop: "10px", fontSize: "14px", color: "#dc2626" }}>
              Cancellation reason: <em>{booking.cancellationReason}</em>
            </p>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.sectionTitle}>
            <Clock3 size={22} />
            <h2>Request status</h2>
          </div>
          <p>
            {status === "pending" && "Your request is waiting for the car owner to respond."}
            {status === "requested" && "Your request is waiting for the car owner to respond."}
            {status === "confirmed" && "Your rental request has been accepted and confirmed."}
            {status === "in_progress" && "Trip currently in progress across Addis Ababa."}
            {status === "completed" && "This rental is marked as completed."}
            {status === "reviewed" && "This rental has been completed and reviewed."}
            {status === "cancelled" && "This booking has been cancelled and dates were released."}
            {status === "declined" && "The owner declined this booking request."}
            {status === "rejected" && "The owner declined this booking request."}
            {status === "disputed" && "A support dispute has been opened for this rental."}
            {status === "resolved" && "The dispute has been resolved by platform administration."}
          </p>
          <p className={styles.note}>
            Demo application · Sheggar Wheels marketplace simulation.
          </p>
        </section>
      </div>
    </main>
  );
}
