"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CarFront, Clock3 } from "lucide-react";
import { getBookings, getCars } from "../../../lib/demo-data";
import styles from "./MyBookings.module.css";

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

const statusLabels = {
  pending: "Awaiting response",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Declined",
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [filter, setFilter] = useState("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setBookings(getBookings());
      setCars(getCars());

      try {
        setActiveUser(
          JSON.parse(
            window.localStorage.getItem("sw_current_user_v1") || "null"
          )
        );
      } catch {
        setActiveUser(null);
      }

      setReady(true);
    };

    refresh();
    window.addEventListener("sheggar-storage-change", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("sheggar-storage-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const myBookings = useMemo(() => {
    if (!activeUser || activeUser.role !== "renter") return [];

    return bookings
      .filter((booking) => booking.renterId === activeUser.id)
      .filter((booking) => filter === "all" || booking.status === filter)
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.startDate) -
          new Date(a.createdAt || a.startDate)
      );
  }, [bookings, activeUser, filter]);

  const counts = useMemo(() => {
    const own = activeUser?.role === "renter"
      ? bookings.filter((booking) => booking.renterId === activeUser.id)
      : [];

    return {
      all: own.length,
      pending: own.filter((booking) => booking.status === "pending").length,
      confirmed: own.filter((booking) => booking.status === "confirmed").length,
      completed: own.filter((booking) => booking.status === "completed").length,
    };
  }, [bookings, activeUser]);

  if (!ready) {
    return <main className={styles.page}><p>Loading your bookings…</p></main>;
  }

  if (!activeUser || activeUser.role !== "renter") {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.empty}>
            <CarFront size={38} />
            <h1>Sign in to view your bookings</h1>
            <p>Your rental requests and their latest statuses will appear here.</p>
            <Link href="/signin" className={styles.primaryLink}>Sign in</Link>
            <Link href="/cars" className={styles.secondaryLink}>Browse cars</Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/cars" className={styles.backLink}>← Browse cars</Link>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>RENTER WORKSPACE</p>
            <h1>My bookings</h1>
            <p>Track your rental requests, dates, and booking status.</p>
          </div>
          <div className={styles.summary}>
            <CalendarDays size={22} />
            <div>
              <strong>{counts.all}</strong>
              <span>Total bookings</span>
            </div>
          </div>
        </header>

        <section className={styles.stats} aria-label="Booking summary">
          <div><span>Awaiting response</span><strong>{counts.pending}</strong></div>
          <div><span>Confirmed</span><strong>{counts.confirmed}</strong></div>
          <div><span>Completed</span><strong>{counts.completed}</strong></div>
        </section>

        <nav className={styles.filters} aria-label="Filter my bookings">
          {[
            ["all", "All bookings"],
            ["pending", "Pending"],
            ["confirmed", "Confirmed"],
            ["completed", "Completed"],
            ["cancelled", "Cancelled"],
            ["rejected", "Declined"],
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

        {myBookings.length === 0 ? (
          <section className={styles.empty}>
            <Clock3 size={34} />
            <h2>{counts.all === 0 ? "No bookings yet" : "No bookings in this filter"}</h2>
            <p>
              {counts.all === 0
                ? "Find a car you like and send a rental request to get started."
                : "Try another filter to see your other rental requests."}
            </p>
            {counts.all === 0 && (
              <Link href="/cars" className={styles.primaryLink}>Explore available cars</Link>
            )}
          </section>
        ) : (
          <section className={styles.list} aria-label="Your rental bookings">
            {myBookings.map((booking) => {
              const car = cars.find((item) => item.id === booking.carId);
              const status = booking.status || "pending";

              return (
                <article className={styles.card} key={booking.id}>
                  <div className={styles.cardTop}>
                    <div>
                      <p className={styles.eyebrow}>RENTAL REQUEST</p>
                      <h2>
                        {car
                          ? `${car.year} ${car.make} ${car.model}`
                          : "Vehicle listing"}
                      </h2>
                      <p className={styles.bookingId}>Reference: {booking.id}</p>
                    </div>
                    <span className={`${styles.status} ${styles[status] || ""}`}>
                      {statusLabels[status] || status}
                    </span>
                  </div>

                  <div className={styles.details}>
                    <div><span>Pickup</span><strong>{dateLabel(booking.startDate)}</strong></div>
                    <div><span>Return</span><strong>{dateLabel(booking.endDate)}</strong></div>
                    <div><span>Daily rate</span><strong>{money(car?.pricePerDay)}</strong></div>
                    <div><span>Total price</span><strong>{money(booking.totalPrice)}</strong></div>
                  </div>

                  {car && (
                    <div className={styles.cardFooter}>
                      <span>{car.location || "Addis Ababa"}</span>
                      <Link href={`/cars/${car.id}`} className={styles.secondaryLink}>
                        View car details →
                      </Link>
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
