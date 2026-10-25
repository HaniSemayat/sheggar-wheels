"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, XCircle } from "lucide-react";
import { getBookings, getCars } from "../../../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../../../lib/storage";
import styles from "./OwnerBookings.module.css";

const DEFAULT_OWNER_ID = "owner-001";

const money = (amount) =>
  `${Number(amount || 0).toLocaleString("en-ET")} ETB`;

const dateLabel = (value) =>
  value
    ? new Date(`${value}T00:00:00`).toLocaleDateString("en-ET", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Not specified";

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([]);
  const [ownerId, setOwnerId] = useState(DEFAULT_OWNER_ID);
  const [cars, setCars] = useState([]);
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refreshDashboard = () => {
      setBookings(getBookings());
      setCars(getCars());

      try {
        const activeUser = JSON.parse(
          window.localStorage.getItem("sw_current_user_v1") || "null"
        );

        if (activeUser?.role === "owner") {
          setOwnerId(activeUser.id);
        }

        setReady(true);
      } catch {
        setReady(true);
      }
    };

    refreshDashboard();

    window.addEventListener("sheggar-storage-change", refreshDashboard);
    window.addEventListener("storage", refreshDashboard);

    return () => {
      window.removeEventListener("sheggar-storage-change", refreshDashboard);
      window.removeEventListener("storage", refreshDashboard);
    };
  }, []);

  const ownerCars = cars.filter((car) => car.ownerId === ownerId);
  const ownerCarIds = new Set(ownerCars.map((car) => car.id));

  const ownerBookings = bookings
    .filter((booking) => ownerCarIds.has(booking.carId))
    .filter((booking) => filter === "all" || booking.status === filter)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
  function updateStatus(bookingId, status) {
    const updated = bookings.map((booking) =>
      booking.id === bookingId ? { ...booking, status } : booking
    );

    if (writeStorage(STORAGE_KEYS.bookings, updated)) {
      setBookings(updated);
      setMessage(
        status === "confirmed"
          ? "Booking request accepted."
          : "Booking request rejected."
      );
    } else {
      setMessage("Could not update this booking. Please try again.");
    }
  }

  if (!ready) {
    return <main className={styles.page}><p>Loading booking requests…</p></main>;
  }

  const pendingCount = ownerBookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/owner/cars" className={styles.backLink}>
          ← Back to your cars
        </Link>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>OWNER WORKSPACE</p>
            <h1>Booking requests</h1>
            <p>Review rental requests for your listed vehicles.</p>
          </div>
          <div className={styles.count}>
            <Clock3 size={19} />
            <span><strong>{pendingCount}</strong> pending</span>
          </div>
        </header>

        <nav className={styles.filters} aria-label="Filter bookings">
          {[
            ["all", "All requests"],
            ["pending", "Pending"],
            ["confirmed", "Accepted"],
            ["rejected", "Rejected"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={filter === value ? styles.activeFilter : styles.filter}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </nav>

        {message && <p className={styles.message} role="status">{message}</p>}

        {ownerBookings.length === 0 ? (
          <section className={styles.empty}>
            <CalendarDays size={32} />
            <h2>No booking requests here yet</h2>
            <p>New requests for your cars will appear on this page.</p>
            <Link href="/cars" className={styles.secondaryLink}>Browse cars</Link>
          </section>
        ) : (
          <section className={styles.list} aria-label="Booking requests">
            {ownerBookings.map((booking) => {
              const car = cars.find((item) => item.id === booking.carId);
              const status = booking.status || "pending";

              return (
                <article className={styles.card} key={booking.id}>
                  <div className={styles.cardTop}>
                    <div>
                      <p className={styles.eyebrow}>BOOKING REQUEST</p>
                      <h2>{car ? `${car.year} ${car.make} ${car.model}` : "Vehicle listing"}</h2>
                      <p className={styles.bookingId}>{booking.id}</p>
                    </div>
                    <span className={`${styles.status} ${styles[status] || ""}`}>
                      {status}
                    </span>
                  </div>

                  <div className={styles.details}>
                    <div>
                      <span>Pickup</span>
                      <strong>{dateLabel(booking.startDate)}</strong>
                    </div>
                    <div>
                      <span>Return</span>
                      <strong>{dateLabel(booking.endDate)}</strong>
                    </div>
                    <div>
                      <span>Renter</span>
                      <strong>{booking.renterId || "Demo renter"}</strong>
                    </div>
                    <div>
                      <span>Total price</span>
                      <strong>{money(booking.totalPrice)}</strong>
                    </div>
                  </div>

                  {status === "pending" && (
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className={styles.accept}
                        onClick={() => updateStatus(booking.id, "confirmed")}
                      >
                        <CheckCircle2 size={17} /> Accept request
                      </button>
                      <button
                        type="button"
                        className={styles.reject}
                        onClick={() => updateStatus(booking.id, "rejected")}
                      >
                        <XCircle size={17} /> Reject request
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}


