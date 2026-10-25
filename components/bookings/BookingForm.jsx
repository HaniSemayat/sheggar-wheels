"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ShieldCheck } from "lucide-react";
import { getBookings } from "../../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../../lib/storage";
import styles from "./BookingForm.module.css";

export default function BookingForm({ car }) {
  const router = useRouter();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const today = new Date();
  const minDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const days = useMemo(() => {
    if (!startDate || !endDate || endDate <= startDate) return 0;
    return Math.ceil(
      (new Date(`${endDate}T00:00:00`) - new Date(`${startDate}T00:00:00`)) /
        86400000
    );
  }, [startDate, endDate]);

  const total = days * Number(car.pricePerDay || 0);
  const unavailable = car.status && car.status !== "available";

  function handleBooking(event) {
    event.preventDefault();
    setMessage("");

    if (saving) return;

    if (!startDate || !endDate || days < 1 || startDate < minDate) {
      setMessage("Choose a valid pickup date and a return date after it.");
      return;
    }

    if (unavailable) {
      setMessage("This car is not currently available for booking.");
      return;
    }

    let activeUser;

    try {
      activeUser = JSON.parse(
        window.localStorage.getItem("sw_current_user_v1") || "null"
      );
    } catch {
      activeUser = null;
    }

    if (!activeUser) {
      setMessage("Please sign in as a renter before requesting a booking.");
      return;
    }

    if (activeUser.role !== "renter") {
      setMessage("Only renter accounts can request a booking. Please sign in as a renter.");
      return;
    }

    if (activeUser.id === car.ownerId) {
      setMessage("You cannot book your own car.");
      return;
    }

    const bookings = getBookings();

    const dateConflict = bookings.some((booking) => {
      if (booking.carId !== car.id) return false;
      if (!["pending", "confirmed"].includes(booking.status)) return false;

      return startDate < booking.endDate && endDate > booking.startDate;
    });

    const unavailableConflict = (car.unavailableDates || []).some(
      (date) => date >= startDate && date < endDate
    );

    if (dateConflict || unavailableConflict) {
      setMessage("Those dates are unavailable. Please choose different dates.");
      return;
    }

    const newBooking = {
      id: `booking-${Date.now()}`,
      carId: car.id,
      renterId: activeUser.id,
      ownerId: car.ownerId,
      startDate,
      endDate,
      totalPrice: total,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    setSaving(true);

    const success = writeStorage(STORAGE_KEYS.bookings, [
      ...bookings,
      newBooking,
    ]);

    setSaving(false);

    if (!success) {
      setMessage("Could not save your booking. Please try again.");
      return;
    }

    setMessage("Booking request saved! Your request is pending confirmation.");
    setStartDate("");
    setEndDate("");
    router.refresh();
  }

  if (unavailable) {
    return (
      <p className={styles.message} role="status">
        This vehicle is currently unavailable for booking.
      </p>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleBooking}>
      <label className={styles.field}>
        <span>Pickup date</span>
        <input
          type="date"
          min={minDate}
          value={startDate}
          onChange={(event) => {
            setStartDate(event.target.value);
            setMessage("");
          }}
          required
        />
      </label>

      <label className={styles.field}>
        <span>Return date</span>
        <input
          type="date"
          min={startDate || minDate}
          value={endDate}
          onChange={(event) => {
            setEndDate(event.target.value);
            setMessage("");
          }}
          required
        />
      </label>

      {days > 0 && (
        <div className={styles.summary}>
          <span>{days} rental {days === 1 ? "day" : "days"}</span>
          <strong>{total.toLocaleString("en-ET")} ETB total</strong>
        </div>
      )}

      <div className={styles.notice}>
        <ShieldCheck size={19} aria-hidden="true" />
        <span>Demo booking only. No payment is collected.</span>
      </div>

      <button className={styles.submit} type="submit" disabled={saving}>
        <CalendarDays size={18} aria-hidden="true" />
        {saving ? "Saving request..." : "Request booking"}
      </button>

      {message && (
        <p className={styles.message} role="status">{message}</p>
      )}
    </form>
  );
}
