"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  Car,
  Users,
  CalendarDays,
  AlertTriangle,
  FileText,
  Megaphone,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  XCircle,
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
import { getCars, getUsers, getBookings } from "../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../lib/storage";
import { hasRole } from "../lib/auth-utils";
import { formatETB } from "../lib/format";
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
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  function refresh() {
    setCars(getCars());
    setUsers(getUsers());
    setBookings(getBookings());
    const user = readUser();
    setCurrentUser(user);
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

  const isAdmin = hasRole(currentUser, "admin") || currentUser?.id === "admin-001";

  // Pending car listings requiring admin moderation
  const pendingCars = useMemo(() => {
    return cars.filter((c) => c.moderationStatus === "pending" || c.status === "pending");
  }, [cars]);

  const activeCars = useMemo(() => {
    return cars.filter((c) => c.status === "approved" || c.status === "available" || c.moderationStatus === "approved");
  }, [cars]);

  // Financial GMV & Commission calculation
  const platformRevenue = useMemo(() => {
    const totalGmv = bookings.reduce((sum, b) => sum + (Number(b.totalPrice || b.total) || 0), 0);
    const platformCommission = Math.round(totalGmv * 0.1);
    return { totalGmv, platformCommission };
  }, [bookings]);

  // Platform analytics chart data
  const chartData = [
    { name: "Active Cars", count: activeCars.length },
    { name: "Pending", count: pendingCars.length },
    { name: "Users", count: users.length },
    { name: "Bookings", count: bookings.length },
  ];

  function moderate(carId, decision) {
    if (!isAdmin) {
      setMessage("Access denied. Admin privileges required.");
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

    const updated = latestCars.map((car) =>
      car.id === carId
        ? { ...car, status: decision, moderationStatus: decision }
        : car
    );

    if (!writeStorage(STORAGE_KEYS.cars, updated)) {
      setMessage("Could not save the moderation decision.");
      return;
    }

    setCars(updated);
    setMessage(`Listing successfully ${decision}.`);
    setTimeout(() => setMessage(""), 3500);
  }

  if (!ready) {
    return <main className={styles.page}>Loading admin console…</main>;
  }

  if (!isAdmin) {
    return (
      <main className={styles.page}>
        <section className={styles.panel}>
          <p className={styles.eyebrow}>RESTRICTED WORKSPACE</p>
          <h1>Admin access required</h1>
          <p>Sign in using the administrator demo account to manage listings and platform operations.</p>
          <Link className={styles.button} href="/signin?returnTo=/admin">Go to sign in</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>PLATFORM ADMINISTRATION</p>
            <h1>Sheggar Wheels Control Center</h1>
            <p>Marketplace oversight for Addis Ababa peer-to-peer vehicle rentals.</p>
          </div>
          <span style={{ background: "#fee2e2", color: "#991b1b", padding: "6px 14px", borderRadius: "999px", fontWeight: 800, fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
            <ShieldAlert size={16} /> ADMIN MODE
          </span>
        </header>

        {message && (
          <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", padding: "14px 18px", borderRadius: "8px", marginBottom: "24px" }}>
            {message}
          </div>
        )}

        {/* High-level KPI Stats */}
        <section className={styles.stats}>
          <div className={styles.statCard}>
            <span>Pending Listings</span>
            <strong style={{ color: pendingCars.length > 0 ? "#d97706" : "inherit" }}>
              {pendingCars.length}
            </strong>
          </div>
          <div className={styles.statCard}>
            <span>Active Listings</span>
            <strong>{activeCars.length}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Platform GMV</span>
            <strong style={{ fontSize: "20px" }}>{formatETB(platformRevenue.totalGmv)}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Commission (10%)</span>
            <strong style={{ fontSize: "20px", color: "#16a34a" }}>{formatETB(platformRevenue.platformCommission)}</strong>
          </div>
        </section>

        {/* Admin Navigation Hub */}
        <section style={{ marginBottom: "36px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px" }}>Administrative Tools & Operations</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            <Link
              href="/admin/listings"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "12px",
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                textDecoration: "none",
                color: "var(--color-text)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Car size={22} color="var(--color-brand)" />
                <div>
                  <strong style={{ display: "block" }}>Listing Moderation</strong>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{pendingCars.length} pending review</span>
                </div>
              </div>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/admin/users"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "12px",
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                textDecoration: "none",
                color: "var(--color-text)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Users size={22} color="#7c3aed" />
                <div>
                  <strong style={{ display: "block" }}>User Accounts</strong>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{users.length} registered profiles</span>
                </div>
              </div>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/admin/bookings"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "12px",
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                textDecoration: "none",
                color: "var(--color-text)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <CalendarDays size={22} color="#0284c7" />
                <div>
                  <strong style={{ display: "block" }}>Platform Bookings</strong>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{bookings.length} total orders · CSV</span>
                </div>
              </div>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/admin/disputes"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "12px",
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                textDecoration: "none",
                color: "var(--color-text)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <AlertTriangle size={22} color="#dc2626" />
                <div>
                  <strong style={{ display: "block" }}>Dispute Resolution</strong>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Claims mediation</span>
                </div>
              </div>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/admin/reports"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "12px",
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                textDecoration: "none",
                color: "var(--color-text)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <FileText size={22} color="#16a34a" />
                <div>
                  <strong style={{ display: "block" }}>Commission & Reports</strong>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Financial CSV exports</span>
                </div>
              </div>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/admin/announcements"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                borderRadius: "12px",
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                textDecoration: "none",
                color: "var(--color-text)",
                boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <Megaphone size={22} color="#ea580c" />
                <div>
                  <strong style={{ display: "block" }}>Announcements</strong>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Broadcast platform notices</span>
                </div>
              </div>
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>

        {/* Recharts Activity Overview Chart (Concept #26) */}
        <section style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "24px", marginBottom: "36px" }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 6px" }}>
            Platform Inventory & Activity Metrics
          </h2>
          <p style={{ color: "var(--color-text-muted)", fontSize: "14px", margin: "0 0 20px" }}>
            Real-time aggregate counts for vehicles, user accounts, and bookings.
          </p>

          <div style={{ width: "100%", height: "240px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <Tooltip contentStyle={{ background: "#1e293b", color: "#fff", borderRadius: "8px", border: "none" }} />
                <Bar dataKey="count" fill="#0066ff" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Pending Moderation Queue */}
        <section className={styles.panel}>
          <h2>Pending Listing Approvals ({pendingCars.length})</h2>
          <p style={{ color: "var(--color-text-muted)", margin: "0 0 20px" }}>
            Review new owner vehicle submissions before publishing to the public catalogue.
          </p>

          {pendingCars.length === 0 ? (
            <p style={{ color: "var(--color-text-muted)", padding: "20px 0" }}>
              No listings currently waiting for review.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {pendingCars.map((car) => (
                <article
                  key={car.id}
                  style={{
                    border: "1px solid #fed7aa",
                    background: "#fffaf5",
                    borderRadius: "12px",
                    padding: "18px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "14px",
                  }}
                >
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: "16px" }}>
                      {car.year} {car.make} {car.model}
                    </h3>
                    <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)" }}>
                      Location: {car.location || car.neighbourhood} · {formatETB(car.pricePerDay)}/day · {car.category}
                    </p>
                    <p style={{ margin: "6px 0 0", fontSize: "13px" }}>{car.description}</p>
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => moderate(car.id, "approved")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#16a34a",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => moderate(car.id, "rejected")}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#dc2626",
                        color: "white",
                        border: "none",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
