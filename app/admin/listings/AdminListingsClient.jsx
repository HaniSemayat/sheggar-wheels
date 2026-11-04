"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { getCars } from "../../../lib/demo-data";
import { STORAGE_KEYS, readStorage, writeStorage } from "../../../lib/storage";
import { formatETB } from "../../../lib/format";
import styles from "./AdminListings.module.css";

const FILTERS = ["all", "pending", "approved", "rejected", "archived"];

export default function AdminListingsClient() {
  const [cars, setCars] = useState([]);
  const [filter, setFilter] = useState("all");
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCars(getCars());
      setReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);
  
  const filteredCars = useMemo(() => {
    if (filter === "all") return cars;
    if (filter === "archived") return cars.filter((car) => Boolean(car.archivedAt));

    return cars.filter((car) => {
      const status = car.moderationStatus || car.status || "approved";
      return !car.archivedAt && status === filter;
    });
  }, [cars, filter]);

  function handleModerate(carId, status) {
    const updated = cars.map((car) =>
      car.id === carId ? { ...car, status, moderationStatus: status } : car
    );

    if (!writeStorage(STORAGE_KEYS.cars, updated)) {
      setMsg("Could not save the moderation decision. Please try again.");
      return;
    }

    setCars(updated);
    setMsg(`Listing updated to ${status}.`);
  }

  function toggleArchive(carId) {
    const car = cars.find((item) => item.id === carId);
    if (!car) return;

    const archiving = !car.archivedAt;

    if (
      archiving &&
      !window.confirm("Archive this listing? It will disappear from the public catalogue.")
    ) return;

    const updated = cars.map((item) =>
      item.id === carId
        ? { ...item, archivedAt: archiving ? new Date().toISOString() : null }
        : item
    );

    if (!writeStorage(STORAGE_KEYS.cars, updated)) {
      setMsg("Could not update the listing. Please try again.");
      return;
    }

    setCars(updated);
    setMsg(archiving ? "Listing archived." : "Listing restored.");
  }

  function handlePermanentDelete(carId) {
    const car = cars.find((item) => item.id === carId);
    if (!car) return;

    const confirmed = window.confirm(
      `Permanently delete ${car.year} ${car.make} ${car.model}? Booking and review history will be retained. This cannot be undone.`
    );
    if (!confirmed) return;

    const deletedIds = readStorage(STORAGE_KEYS.deletedCars, []);
    const nextDeletedIds = [...new Set([...deletedIds, carId])];
    const updated = cars.filter((item) => item.id !== carId);

    if (!writeStorage(STORAGE_KEYS.deletedCars, nextDeletedIds)) {
      setMsg("Could not record the permanent deletion. Please try again.");
      return;
    }

    if (!writeStorage(STORAGE_KEYS.cars, updated)) {
      setMsg("Deletion was recorded, but the listing could not be refreshed. Reload the page.");
      return;
    }

    setCars(updated);
    setMsg("Listing permanently deleted. Booking and review history was preserved.");
  }

  if (!ready) {
    return <div className={styles.loading}>Loading listings…</div>;
  }

  return (
    <main className={styles.page}>
      <Link href="/admin" className={styles.backLink}>
        <ArrowLeft size={16} /> Back to Admin Console
      </Link>

      <header className={styles.header}>
        <p className={styles.eyebrow}>INVENTORY AUDIT</p>
        <h1>Listing Moderation Queue</h1>
        <p className={styles.description}>
          Review and approve vehicle listings before they are rented in Addis Ababa.
        </p>
      </header>

      {msg && <div className={styles.message} role="status">{msg}</div>}

      <nav className={styles.filters} aria-label="Filter listings">
        {FILTERS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`${styles.filter} ${filter === tab ? styles.filterActive : ""}`}
            aria-pressed={filter === tab}
          >
            {tab}
          </button>
        ))}
      </nav>

      {filteredCars.length === 0 ? (
        <div className={styles.empty}>No listings found in this category.</div>
      ) : (
        <section className={styles.list} aria-label="Car listings">
          {filteredCars.map((car) => {
            const status = car.moderationStatus || car.status || "approved";
            const statusClass = car.archivedAt
              ? styles.archived
              : status === "approved"
                ? styles.approved
                : status === "pending"
                  ? styles.pending
                  : styles.rejected;

            return (
              <article key={car.id} className={styles.card}>
                <div className={styles.details}>
                  <div className={styles.titleRow}>
                    <h2 className={styles.carName}>
                      {car.year} {car.make} {car.model}
                    </h2>
                    <span className={`${styles.status} ${statusClass}`}>
                      {car.archivedAt ? "Archived" : status}
                    </span>
                  </div>

                  <p className={styles.meta}>
                    {car.category} · {car.transmission} · {car.location || "Addis Ababa"} · {formatETB(car.pricePerDay)}/day
                  </p>
                  {car.description && (
                    <p className={styles.descriptionText}>{car.description}</p>
                  )}
                </div>

                <div className={styles.actions}>
                  {status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => handleModerate(car.id, "approved")}
                      className={`${styles.action} ${styles.approve}`}
                    >
                      <CheckCircle2 size={15} /> Approve
                    </button>
                  )}

                  {status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => handleModerate(car.id, "rejected")}
                      className={`${styles.action} ${styles.reject}`}
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => toggleArchive(car.id)}
                    className={styles.action}
                  >
                    {car.archivedAt ? "Restore" : "Archive"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePermanentDelete(car.id)}
                    className={`${styles.action} ${styles.delete}`}
                  >
                    Delete permanently
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
