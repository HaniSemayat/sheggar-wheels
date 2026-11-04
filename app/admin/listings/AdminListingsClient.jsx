"use client";

import { startTransition, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Filter, Car } from "lucide-react";
import { getCars } from "../../../lib/demo-data";
import { STORAGE_KEYS, readStorage, writeStorage } from "../../../lib/storage";
import { formatETB } from "../../../lib/format";

export default function AdminListingsClient() {
  const [cars, setCars] = useState([]);
  const [filter, setFilter] = useState("all");
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setCars(getCars());
      setReady(true);
    });
  }, []);

  const filteredCars = useMemo(() => {
    if (filter === "all") return cars;
    if (filter === "archived") return cars.filter((c) => Boolean(c.archivedAt));

    return cars.filter((c) => {
      const status = c.moderationStatus || c.status || "approved";
      return !c.archivedAt && status === filter;
    });
  }, [cars, filter]);

  function handleModerate(carId, status) {
    const updated = cars.map((c) =>
      c.id === carId ? { ...c, status, moderationStatus: status } : c
    );
    writeStorage(STORAGE_KEYS.cars, updated);
    setCars(updated);
    setMsg(`Listing updated to ${status}.`);
    setTimeout(() => setMsg(""), 3000);
  }

  function toggleArchive(carId) {
    const car = cars.find((item) => item.id === carId);
    if (!car) return;

    const archiving = !car.archivedAt;

    if (
      archiving &&
      !window.confirm("Archive this listing? It will disappear from the public catalogue.")
    ) {
      return;
    }

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
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading listings…</div>;
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 20px" }}>
      <Link
        href="/admin"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--color-brand, #0066ff)",
          textDecoration: "none",
          fontWeight: 600,
          marginBottom: "20px",
        }}
      >
        <ArrowLeft size={16} /> Back to Admin Console
      </Link>

      <header style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand)", letterSpacing: "0.1em", margin: "0 0 6px" }}>
          INVENTORY AUDIT
        </p>
        <h1 style={{ fontSize: "30px", margin: "0 0 8px" }}>Listing Moderation Queue</h1>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          Review and approve vehicle listings before they are rented in Addis Ababa.
        </p>
      </header>

      {msg && (
        <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
          {msg}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "24px", flexWrap: "wrap" }}>
        {["all", "pending", "approved", "rejected", "archived"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: filter === tab ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
              background: filter === tab ? "var(--color-brand)" : "var(--color-surface)",
              color: filter === tab ? "white" : "var(--color-text)",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {filteredCars.map((c) => {
          const status = c.moderationStatus || c.status || "approved";
          return (
            <div
              key={c.id}
              style={{
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "12px",
                padding: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                  <strong style={{ fontSize: "16px" }}>
                    {c.year} {c.make} {c.model}
                  </strong>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      background: status === "approved" ? "#dcfce7" : status === "pending" ? "#fef3c7" : "#fee2e2",
                      color: status === "approved" ? "#166534" : status === "pending" ? "#92400e" : "#991b1b",
                    }}
                  >
                    {status}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)" }}>
                  {c.category} · {c.transmission} · {c.location || "Addis Ababa"} · {formatETB(c.pricePerDay)}/day
                </p>
                <p style={{ margin: "6px 0 0", fontSize: "13px", maxWidth: "600px" }}>
                  {c.description}
                </p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                {status !== "approved" && (
                  <button
                    type="button"
                    onClick={() => handleModerate(c.id, "approved")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "#16a34a",
                      color: "white",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <CheckCircle2 size={15} /> Approve
                  </button>
                )}
                {status !== "rejected" && (
                  <button
                    type="button"
                    onClick={() => handleModerate(c.id, "rejected")}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px",
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <XCircle size={15} /> Reject
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => toggleArchive(c.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface)",
                    color: "var(--color-text)",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  {c.archivedAt ? "Restore" : "Archive"}
                </button>

                <button
                  type="button"
                  onClick={() => handlePermanentDelete(c.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "6px",
                    border: "1px solid #dc2626",
                    background: "transparent",
                    color: "#dc2626",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Delete permanently
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
