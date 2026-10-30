"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  TrendingUp,
  DollarSign,
  Car,
  Calendar,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { getCars, getBookings } from "../../../lib/demo-data";
import { downloadCSV } from "../../../lib/csv";
import { formatETB } from "../../../lib/format";

const DEFAULT_OWNER_ID = "owner-001";

export default function OwnerEarningsClient() {
  const [ownerId, setOwnerId] = useState(DEFAULT_OWNER_ID);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const activeUser = JSON.parse(
        window.localStorage.getItem("sw_current_user_v1") || "null"
      );
      if (activeUser?.id && (activeUser.role === "owner" || (Array.isArray(activeUser.roles) && activeUser.roles.includes("owner")))) {
        setOwnerId(activeUser.id);
      }
    } catch {
      //
    }

    setCars(getCars());
    setBookings(getBookings());
    setReady(true);
  }, []);

  const myCars = useMemo(() => cars.filter((c) => c.ownerId === ownerId), [cars, ownerId]);
  const myCarIds = useMemo(() => new Set(myCars.map((c) => c.id)), [myCars]);
  const myBookings = useMemo(() => bookings.filter((b) => myCarIds.has(b.carId)), [bookings, myCarIds]);

  const completedBookings = useMemo(() => {
    return myBookings.filter((b) => ["completed", "reviewed", "confirmed"].includes(b.status));
  }, [myBookings]);

  // Aggregates
  const grossRevenue = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (Number(b.totalPrice || b.total) || 0), 0);
  }, [completedBookings]);

  const platformFees = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (Number(b.platformFee || b.platform_fee) || Math.round((Number(b.totalPrice || b.total) || 0) * 0.1)), 0);
  }, [completedBookings]);

  const netEarnings = grossRevenue - platformFees;

  // Monthly data for Recharts (Simulated monthly breakdown across the year)
  const monthlyChartData = useMemo(() => {
    return [
      { month: "Jun", earnings: 18000, bookings: 3 },
      { month: "Jul", earnings: 24500, bookings: 4 },
      { month: "Aug", earnings: 31000, bookings: 5 },
      { month: "Sep", earnings: 22000, bookings: 4 },
      { month: "Oct", earnings: Math.max(netEarnings, 26000), bookings: completedBookings.length || 5 },
      { month: "Nov (Est)", earnings: 35000, bookings: 6 },
    ];
  }, [netEarnings, completedBookings.length]);

  // Per-car performance breakdown
  const carPerformance = useMemo(() => {
    return myCars.map((car) => {
      const carBookings = completedBookings.filter((b) => b.carId === car.id);
      const revenue = carBookings.reduce((sum, b) => sum + (Number(b.totalPrice || b.total) || 0), 0);
      return {
        id: car.id,
        name: `${car.year} ${car.make} ${car.model}`,
        location: car.location,
        dailyRate: car.pricePerDay,
        bookingsCount: carBookings.length,
        revenue,
        net: Math.round(revenue * 0.9),
      };
    });
  }, [myCars, completedBookings]);

  function handleExportCSV() {
    const rows = carPerformance.map((item) => ({
      "Vehicle": item.name,
      "Location": item.location,
      "Daily Rate (ETB)": item.dailyRate,
      "Total Completed Bookings": item.bookingsCount,
      "Gross Revenue (ETB)": item.revenue,
      "Net Owner Payout (ETB)": item.net,
    }));
    downloadCSV("owner-earnings-report.csv", rows);
  }

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading earnings analytics…</div>;
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 20px" }}>
      <Link
        href="/owner"
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
        <ArrowLeft size={16} /> Back to Owner Hub
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand)", letterSpacing: "0.1em", margin: "0 0 6px" }}>
            REVENUE & FINANCIAL REPORTING
          </p>
          <h1 style={{ fontSize: "32px", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Earnings & Fleet Performance
          </h1>
          <p style={{ color: "var(--color-text-muted, #6b7280)", margin: 0 }}>
            Visual analytics and revenue statements for your rental vehicles.
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
          <Download size={16} /> Export Earnings CSV
        </button>
      </div>

      {/* Top Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "36px" }}>
        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            Gross Platform Bookings
          </span>
          <strong style={{ display: "block", fontSize: "26px", marginTop: "8px" }}>
            {formatETB(grossRevenue)}
          </strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            Platform Fee (10%)
          </span>
          <strong style={{ display: "block", fontSize: "26px", marginTop: "8px", color: "#d97706" }}>
            {formatETB(platformFees)}
          </strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>
            Net Owner Payout
          </span>
          <strong style={{ display: "block", fontSize: "26px", marginTop: "8px", color: "#16a34a" }}>
            {formatETB(netEarnings)}
          </strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase" }}>
            Total Completed Bookings
          </span>
          <strong style={{ display: "block", fontSize: "26px", marginTop: "8px" }}>
            {completedBookings.length}
          </strong>
        </div>
      </div>

      {/* Recharts Bar Chart: Monthly Earnings (Concept #26) */}
      <section style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "24px", marginBottom: "36px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 4px" }}>
          Monthly Revenue Trend (ETB)
        </h2>
        <p style={{ color: "var(--color-text-muted)", fontSize: "14px", margin: "0 0 24px" }}>
          Visual rental income trend over the past 6 months across all vehicles.
        </p>

        <div style={{ width: "100%", height: "300px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyChartData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="month" tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
              <YAxis
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
                tickFormatter={(val) => `${val / 1000}k`}
              />
              <Tooltip
                formatter={(val) => [`${Number(val).toLocaleString()} ETB`, "Earnings"]}
                contentStyle={{ background: "#1e293b", color: "#fff", borderRadius: "8px", border: "none" }}
              />
              <Bar dataKey="earnings" fill="#0066ff" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Per-Car Breakdown Table */}
      <section style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px" }}>
          Per-Vehicle Earnings Breakdown
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
                <th style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Vehicle</th>
                <th style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Location</th>
                <th style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Daily Rate</th>
                <th style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Bookings</th>
                <th style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Gross Revenue</th>
                <th style={{ padding: "12px 14px", color: "var(--color-text-muted)" }}>Net Earnings (90%)</th>
              </tr>
            </thead>
            <tbody>
              {carPerformance.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                  <td style={{ padding: "14px", fontWeight: 600 }}>{c.name}</td>
                  <td style={{ padding: "14px", color: "var(--color-text-muted)" }}>{c.location}</td>
                  <td style={{ padding: "14px" }}>{formatETB(c.dailyRate)}</td>
                  <td style={{ padding: "14px" }}>{c.bookingsCount}</td>
                  <td style={{ padding: "14px", fontWeight: 600 }}>{formatETB(c.revenue)}</td>
                  <td style={{ padding: "14px", fontWeight: 700, color: "#16a34a" }}>{formatETB(c.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
