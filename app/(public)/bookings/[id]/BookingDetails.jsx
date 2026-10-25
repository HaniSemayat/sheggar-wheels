"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, CarFront, Clock3 } from "lucide-react";
import { getBookings, getCars } from "../../../../lib/demo-data";
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
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Declined",
};

export default function BookingDetails({ id }) {
  const [booking, setBooking] = useState(null);
  const [car, setCar] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

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

      const found = getBookings().find((item) => item.id === id);
      setUser(activeUser);
      setBooking(
        activeUser?.role === "renter" && found?.renterId === activeUser.id
          ? found
          : null
      );
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

  if (!ready) {
    return <main className={styles.page}>Loading booking details�</main>;
  }

  if (!user || user.role !== "renter") {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <h1>Sign in as a renter</h1>
          <p>Sign in with the renter account associated with this booking.</p>
          <Link href="/signin" className={styles.button}>Sign in</Link>
        </section>
      </main>
    );
  }

  if (!booking) {
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

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/my-bookings" className={styles.backLink}>
          <ArrowLeft size={17} /> Back to my bookings
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>RENTER WORKSPACE</p>
          <h1>Booking details</h1>
          <p>Reference: {booking.id}</p>
          <span className={`${styles.status} ${styles[status] || ""}`}>
            {labels[status] || status}
          </span>
        </header>

        <section className={styles.card}>
          <div className={styles.sectionTitle}>
            <CarFront size={22} />
            <h2>Your vehicle</h2>
          </div>
          <h3>{car ? `${car.year} ${car.make} ${car.model}` : "Vehicle listing"}</h3>
          <p>{car?.location || "Location unavailable"}</p>
          {car && (
            <Link href={`/cars/${car.id}`} className={styles.button}>
              View vehicle
            </Link>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.sectionTitle}>
            <CalendarDays size={22} />
            <h2>Rental schedule</h2>
          </div>
          <div className={styles.grid}>
            <div><span>Pickup date</span><strong>{dateLabel(booking.startDate)}</strong></div>
            <div><span>Return date</span><strong>{dateLabel(booking.endDate)}</strong></div>
            <div><span>Daily rate at booking</span><strong>{money(booking.pricePerDay ?? car?.pricePerDay)}</strong></div>
            <div><span>Total rental price</span><strong>{money(booking.totalPrice)}</strong></div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.sectionTitle}>
            <Clock3 size={22} />
            <h2>Request status</h2>
          </div>
          <p>
            {status === "pending" && "Your request is waiting for the car owner to respond."}
            {status === "confirmed" && "Your rental request has been accepted by the owner."}
            {status === "completed" && "This rental is marked as completed."}
            {status === "cancelled" && "This booking has been cancelled."}
            {status === "rejected" && "The owner declined this booking request."}
            {!["pending", "confirmed", "completed", "cancelled", "rejected"].includes(status) &&
              "Check your booking status from the bookings page."}
          </p>
          <p className={styles.note}>
            Demo booking only. No payment has been collected.
          </p>
        </section>
      </div>
    </main>
  );
}
