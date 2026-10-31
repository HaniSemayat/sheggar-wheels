"use client";

import { startTransition, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Download, DollarSign, TrendingUp, BarChart3 } from "lucide-react";
import { getBookings, getCars } from "../../../lib/demo-data";
import { downloadCSV } from "../../../lib/csv";
import { formatETB } from "../../../lib/format";

export default function AdminReportsClient() {
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
      setBookings(getBookings());
      setCars(getCars());
      setReady(true);
    });
  }, []);

  const totalGMV = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (Number(b.totalPrice || b.total) || 0), 0);
  }, [bookings]);

  const platformCommission = Math.round(totalGMV * 0.1);
  const averageBookingValue = bookings.length > 0 ? Math.round(totalGMV / bookings.length) : 0;

  // Breakdown by vehicle category
  const categoryBreakdown = useMemo(() => {
    const map = {};
    for (const b of bookings) {
      const car = cars.find((c) => c.id === b.carId);
      const cat = car?.category || "Other";
      if (!map[cat]) {
        map[cat] = { category: cat, bookingsCount: 0, gmv: 0 };
      }
      map[cat].bookingsCount += 1;
      map[cat].gmv += Number(b.totalPrice || b.total) || 0;
    }
    return Object.values(map);
  }, [bookings, cars]);

  function handleExportCSV() {
    const rows = categoryBreakdown.map((row) => ({
      "Vehicle Category": row.category,
      "Completed Bookings": row.bookingsCount,
      "Gross Marketplace Volume (ETB)": row.gmv,
      "Platform 10% Commission (ETB)": Math.round(row.gmv * 0.1),
    }));
    downloadCSV("platform-financial-report.csv", rows);
  }

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading financial reports…</div>;
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

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand)", letterSpacing: "0.1em", margin: "0 0 6px" }}>
            FINANCIAL PERFORMANCE
          </p>
          <h1 style={{ fontSize: "30px", margin: "0 0 8px" }}>Platform Financial Audit & Reports</h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Marketplace gross volume, platform commission, and category revenue statistics.
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
          <Download size={16} /> Export Financial CSV
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "36px" }}>
        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            Gross Volume (GMV)
          </span>
          <strong style={{ display: "block", fontSize: "26px", marginTop: "8px" }}>
            {formatETB(totalGMV)}
          </strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>
            Platform Revenue (10%)
          </span>
          <strong style={{ display: "block", fontSize: "26px", marginTop: "8px", color: "#16a34a" }}>
            {formatETB(platformCommission)}
          </strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            Average Booking Value
          </span>
          <strong style={{ display: "block", fontSize: "26px", marginTop: "8px" }}>
            {formatETB(averageBookingValue)}
          </strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            Total Transactions
          </span>
          <strong style={{ display: "block", fontSize: "26px", marginTop: "8px" }}>
            {bookings.length}
          </strong>
        </div>
      </div>

      <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px" }}>Category Performance Breakdown</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
              <th style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Category</th>
              <th style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Bookings</th>
              <th style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Gross Volume (ETB)</th>
              <th style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Platform Commission (10%)</th>
            </tr>
          </thead>
          <tbody>
            {categoryBreakdown.map((row) => (
              <tr key={row.category} style={{ borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                <td style={{ padding: "14px", fontWeight: 600 }}>{row.category}</td>
                <td style={{ padding: "14px" }}>{row.bookingsCount}</td>
                <td style={{ padding: "14px", fontWeight: 600 }}>{formatETB(row.gmv)}</td>
                <td style={{ padding: "14px", fontWeight: 700, color: "#16a34a" }}>
                  {formatETB(Math.round(row.gmv * 0.1))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
