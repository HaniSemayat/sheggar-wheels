"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Download, CalendarDays, Filter } from "lucide-react";
import { getBookings, getCars, getUsers } from "../../../lib/demo-data";
import { downloadCSV } from "../../../lib/csv";
import { formatETB, formatDate } from "../../../lib/format";

export default function AdminBookingsClient() {
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setBookings(getBookings());
    setCars(getCars());
    setUsers(getUsers());
    setReady(true);
  }, []);

  const filteredBookings = useMemo(() => {
    if (filter === "all") return bookings;
    return bookings.filter((b) => b.status === filter);
  }, [bookings, filter]);

  function handleExportCSV() {
    const rows = filteredBookings.map((b) => {
      const car = cars.find((c) => c.id === b.carId);
      const renter = users.find((u) => u.id === b.renterId);
      return {
        "Booking ID": b.id,
        "Vehicle": car ? `${car.year} ${car.make} ${car.model}` : b.carId,
        "Renter Name": renter ? renter.name : b.renterId,
        "Pickup Date": b.startDate,
        "Return Date": b.endDate,
        "Daily Rate (ETB)": b.pricePerDay || car?.pricePerDay || 0,
        "Total (ETB)": b.totalPrice || b.total || 0,
        "Platform Commission (10%)": Math.round((Number(b.totalPrice || b.total) || 0) * 0.1),
        "Status": b.status,
        "Payment Status": b.paymentStatus || b.payment_status || "unpaid",
        "Created At": b.createdAt || "",
      };
    });
    downloadCSV("admin-all-bookings.csv", rows);
  }

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading platform bookings…</div>;
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "36px 20px" }}>
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand)", letterSpacing: "0.1em", margin: "0 0 6px" }}>
            TRANSACTION LOGS
          </p>
          <h1 style={{ fontSize: "30px", margin: "0 0 8px" }}>Platform Bookings & Audit Trail</h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Inspect all rental contracts, payment states, and download compliance reports.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "var(--color-brand)",
            color: "white",
            padding: "10px 18px",
            borderRadius: "8px",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Download size={16} /> Export Bookings CSV
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
        {["all", "requested", "confirmed", "in_progress", "completed", "cancelled", "declined"].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              border: filter === tab ? "1px solid var(--color-brand)" : "1px solid var(--color-border)",
              background: filter === tab ? "var(--color-brand)" : "var(--color-surface)",
              color: filter === tab ? "white" : "var(--color-text)",
              fontWeight: 600,
              fontSize: "13px",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {tab.replace("_", " ")}
          </button>
        ))}
      </div>

      <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>Reference</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>Vehicle</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>Dates</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>Total (ETB)</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>Payment</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map((b) => {
              const car = cars.find((c) => c.id === b.carId);
              return (
                <tr key={b.id} style={{ borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                  <td style={{ padding: "14px 16px", fontFamily: "monospace", fontSize: "13px" }}>
                    {b.id}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 600 }}>
                    {car ? `${car.year} ${car.make} ${car.model}` : b.carId}
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>
                    {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  </td>
                  <td style={{ padding: "14px 16px", fontWeight: 700 }}>
                    {formatETB(b.totalPrice || b.total)}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: b.paymentStatus === "demo_paid" ? "#dcfce7" : "#f1f5f9",
                        color: b.paymentStatus === "demo_paid" ? "#166534" : "#475569",
                      }}
                    >
                      {b.paymentStatus || b.payment_status || "unpaid"}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background:
                          b.status === "confirmed" ? "#dcfce7" :
                          b.status === "completed" ? "#f1f5f9" :
                          b.status === "cancelled" ? "#fee2e2" : "#fef3c7",
                        color:
                          b.status === "confirmed" ? "#166534" :
                          b.status === "completed" ? "#475569" :
                          b.status === "cancelled" ? "#991b1b" : "#92400e",
                      }}
                    >
                      {b.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
