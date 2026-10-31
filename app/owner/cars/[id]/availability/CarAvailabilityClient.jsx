"use client";

import { startTransition, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { getCars } from "../../../../../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../../../../../lib/storage";
import { formatDate } from "../../../../../lib/format";

export default function CarAvailabilityClient({ id }) {
  const [car, setCar] = useState(null);
  const [unavailableDates, setUnavailableDates] = useState([]);
  const [newDate, setNewDate] = useState("");
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
    const allCars = getCars();
    const found = allCars.find((c) => c.id === id);
    if (found) {
      setCar(found);
      setUnavailableDates(found.unavailableDates || []);
    }
    setReady(true);
    });
  }, [id]);

  function handleAddDate(e) {
    e.preventDefault();
    if (!newDate) return;

    if (unavailableDates.includes(newDate)) {
      setMsg("This date is already blocked.");
      return;
    }

    const updatedDates = [...unavailableDates, newDate].sort();
    setUnavailableDates(updatedDates);

    const allCars = getCars();
    const nextCars = allCars.map((c) =>
      c.id === id ? { ...c, unavailableDates: updatedDates } : c
    );
    writeStorage(STORAGE_KEYS.cars, nextCars);
    setNewDate("");
    setMsg("Date successfully blocked.");
    setTimeout(() => setMsg(""), 3000);
  }

  function handleRemoveDate(dateToRemove) {
    const updatedDates = unavailableDates.filter((d) => d !== dateToRemove);
    setUnavailableDates(updatedDates);

    const allCars = getCars();
    const nextCars = allCars.map((c) =>
      c.id === id ? { ...c, unavailableDates: updatedDates } : c
    );
    writeStorage(STORAGE_KEYS.cars, nextCars);
    setMsg("Date unblocked.");
    setTimeout(() => setMsg(""), 3000);
  }

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading availability settings…</div>;
  }

  if (!car) {
    return (
      <div style={{ maxWidth: "600px", margin: "64px auto", textAlign: "center" }}>
        <h2>Car Not Found</h2>
        <Link href="/owner/cars" style={{ color: "var(--color-brand)" }}>Back to fleet</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "36px 20px" }}>
      <Link
        href="/owner/cars"
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
        <ArrowLeft size={16} /> Back to fleet management
      </Link>

      <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "32px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
        <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand)", letterSpacing: "0.1em", margin: "0 0 6px" }}>
          AVAILABILITY & CALENDAR
        </p>
        <h1 style={{ fontSize: "26px", margin: "0 0 6px" }}>
          Manage Blackout Dates
        </h1>
        <p style={{ color: "var(--color-text-muted, #6b7280)", margin: "0 0 24px" }}>
          {car.year} {car.make} {car.model} · Block specific days for maintenance or private use.
        </p>

        {msg && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "12px", borderRadius: "8px", marginBottom: "20px", fontSize: "14px" }}>
            <CheckCircle2 size={16} />
            <span>{msg}</span>
          </div>
        )}

        {/* Add Date Form */}
        <form onSubmit={handleAddDate} style={{ display: "flex", gap: "10px", marginBottom: "28px" }}>
          <input
            type="date"
            value={newDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setNewDate(e.target.value)}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px solid var(--color-border, #d1d5db)",
              fontSize: "14px",
            }}
            required
          />
          <button
            type="submit"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--color-brand)",
              color: "white",
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Plus size={16} /> Block Date
          </button>
        </form>

        <h3 style={{ fontSize: "16px", margin: "0 0 14px", fontWeight: 700 }}>
          Currently Blocked Dates ({unavailableDates.length})
        </h3>

        {unavailableDates.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", margin: 0 }}>
            No dates are currently blacked out. Vehicle is open for booking whenever available.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {unavailableDates.map((d) => (
              <div
                key={d}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  background: "var(--color-surface-muted, #f8fafc)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Calendar size={16} style={{ color: "var(--color-brand)" }} />
                  <strong>{formatDate(d)}</strong>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>({d})</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveDate(d)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "transparent",
                    border: "none",
                    color: "#dc2626",
                    fontSize: "13px",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  <Trash2 size={15} /> Unblock
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
