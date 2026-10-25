"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCars, getUsers, getBookings } from "../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../lib/storage";
import styles from "./AdminDashboard.module.css";

function readUser() {
  try {
    return JSON.parse(window.localStorage.getItem("sw_current_user_v1") || "null");
  } catch {
    return null;
  }
}

export default function AdminDashboard() {
  const [cars, setCars] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [ready, setReady] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [message, setMessage] = useState("");

  function refresh() {
    setCars(getCars());
    setUsers(getUsers());
    setBookings(getBookings());
    const user = readUser();
    setAdmin(user?.role === "admin" && user?.id === "admin-001");
    setReady(true);
  }

  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    window.addEventListener("sheggar-storage-change", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("sheggar-storage-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  function moderate(carId, decision) {
    const user = readUser();

    if (user?.role !== "admin" || user?.id !== "admin-001") {
      setMessage("Access denied. Sign in with the admin demo account.");
      setAdmin(false);
      return;
    }

    if (!["approved", "rejected"].includes(decision)) {
      setMessage("Invalid moderation action.");
      return;
    }

    const latestCars = getCars();
    const target = latestCars.find((car) => car.id === carId);

    if (!target) {
      setMessage("Listing not found. Refresh and try again.");
      refresh();
      return;
    }

    if (target.moderationStatus !== "pending") {
      setMessage("This listing is no longer awaiting review.");
      refresh();
      return;
    }

    const updated = latestCars.map((car) =>
      car.id === carId
        ? { ...car, moderationStatus: decision }
        : car
    );

    if (!writeStorage(STORAGE_KEYS.cars, updated)) {
      setMessage("Could not save the moderation decision.");
      return;
    }

    setCars(updated);
    setMessage(`Listing ${decision}.`);
  }

  if (!ready) {
    return <main className={styles.page}>Loading admin dashboard�</main>;
  }

  if (!admin) {
    return (
      <main className={styles.page}>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>RESTRICTED WORKSPACE</p>
          <h1>Admin access required</h1>
          <p>Sign in using the administrator demo account to manage listings.</p>
          <Link className={styles.button} href="/signin">Go to sign in</Link>
        </section>
      </main>
    );
  }

  const pending = cars.filter((car) => car.moderationStatus === "pending");
  const approved = cars.filter((car) => car.moderationStatus !== "rejected" &&
    car.moderationStatus !== "pending");
  const rejected = cars.filter((car) => car.moderationStatus === "rejected");

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>SHEGGAR WHEELS � ADMIN</p>
          <h1>Marketplace overview</h1>
          <p>Review new listings and monitor demo marketplace activity.</p>
        </header>

        <section className={styles.stats} aria-label="Marketplace statistics">
          <article className={styles.stat}><span>Total listings</span><strong>{cars.length}</strong></article>
          <article className={styles.stat}><span>Awaiting review</span><strong>{pending.length}</strong></article>
          <article className={styles.stat}><span>Approved / existing</span><strong>{approved.length}</strong></article>
          <article className={styles.stat}><span>Rejected</span><strong>{rejected.length}</strong></article>
          <article className={styles.stat}><span>Demo users</span><strong>{users.length}</strong></article>
          <article className={styles.stat}><span>Bookings</span><strong>{bookings.length}</strong></article>
        </section>

        <section className={styles.panel}>
          <div className={styles.sectionHeading}>
            <div><h2>Listing moderation</h2><p>Only listings explicitly awaiting review can be approved or rejected.</p></div>
            <Link href="/owner/cars">Owner workspace ?</Link>
          </div>

          {message && <p className={styles.message} role="status">{message}</p>}

          {cars.length === 0 ? <p>No listings found.</p> : (
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Vehicle</th><th>Owner</th><th>Daily price</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {cars.map((car) => {
                    const status = car.moderationStatus || "approved";
                    const owner = users.find((u) => u.id === car.ownerId);
                    return (
                      <tr key={car.id}>
                        <td><strong>{car.year} {car.make} {car.model}</strong><small>{car.location}</small></td>
                        <td>{owner?.name || car.ownerId || "Unknown"}</td>
                        <td>{Number(car.pricePerDay || 0).toLocaleString()} ETB</td>
                        <td><span className={styles.status}>{status}</span></td>
                        <td>
                          {status === "pending" ? (
                            <div className={styles.actions}>
                              <button onClick={() => moderate(car.id, "approved")}>Approve</button>
                              <button className={styles.reject} onClick={() => moderate(car.id, "rejected")}>Reject</button>
                            </div>
                          ) : <span className={styles.muted}>No action needed</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className={styles.disclaimer}>
          Demo only: data is stored in this browser. Client-side role checks are not production security.
        </p>
      </div>
    </main>
  );
}
