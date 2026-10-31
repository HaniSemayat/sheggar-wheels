"use client";

import { startTransition, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  CarFront,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  ArrowRight,
  Navigation,
  Star,
  User,
} from "lucide-react";
import { getBookings, getCars } from "../../lib/demo-data";
import { hasRole } from "../../lib/auth-utils";
import { formatETB, formatDate } from "../../lib/format";

export default function DashboardClient() {
  const [currentUser, setCurrentUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [cars, setCars] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
    try {
      const activeUser = JSON.parse(
        window.localStorage.getItem("sw_current_user_v1") || "null"
      );
      setCurrentUser(activeUser);
      setBookings(getBookings());
      setCars(getCars());
    } catch {
      //
    }
    setReady(true);
    });
  }, []);

  const isRenter = hasRole(currentUser, "renter");

  const myBookings = useMemo(() => {
    if (!currentUser) return [];
    return bookings.filter((b) => b.renterId === currentUser.id);
  }, [bookings, currentUser]);

  const upcomingBookings = useMemo(() => {
    return myBookings.filter((b) => ["confirmed", "in_progress"].includes(b.status));
  }, [myBookings]);

  const pendingBookings = useMemo(() => {
    return myBookings.filter((b) => ["requested", "pending"].includes(b.status));
  }, [myBookings]);

  const completedBookings = useMemo(() => {
    return myBookings.filter((b) => ["completed", "reviewed"].includes(b.status));
  }, [myBookings]);

  const totalSpent = useMemo(() => {
    return completedBookings.reduce((sum, b) => sum + (Number(b.totalPrice || b.total) || 0), 0);
  }, [completedBookings]);

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading your dashboard…</div>;
  }

  if (!currentUser) {
    return (
      <div style={{ maxWidth: "560px", margin: "64px auto", padding: "32px", background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", textAlign: "center" }}>
        <User size={48} style={{ color: "var(--color-brand)", marginBottom: "16px" }} />
        <h2>Sign In to Your Dashboard</h2>
        <p style={{ color: "var(--color-text-muted, #6b7280)", marginBottom: "24px" }}>
          Track your trips, view rental history, and manage your bookings in Addis Ababa.
        </p>
        <Link href="/signin?returnTo=/dashboard" style={{ background: "var(--color-brand)", color: "white", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: 700 }}>
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 20px" }}>
      <header style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand)", letterSpacing: "0.1em", margin: "0 0 6px" }}>
          RENTER WORKSPACE
        </p>
        <h1 style={{ fontSize: "32px", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Welcome back, {currentUser.name}
        </h1>
        <p style={{ color: "var(--color-text-muted, #6b7280)", margin: 0 }}>
          Manage your active rentals, reservations, and explore new cars across Addis Ababa.
        </p>
      </header>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "36px" }}>
        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--color-brand)", marginBottom: "8px" }}>
            <Calendar size={20} />
            <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>Active & Upcoming</span>
          </div>
          <strong style={{ fontSize: "28px" }}>{upcomingBookings.length}</strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#d97706", marginBottom: "8px" }}>
            <Clock size={20} />
            <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>Pending Requests</span>
          </div>
          <strong style={{ fontSize: "28px" }}>{pendingBookings.length}</strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#16a34a", marginBottom: "8px" }}>
            <CheckCircle2 size={20} />
            <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>Completed Trips</span>
          </div>
          <strong style={{ fontSize: "28px" }}>{completedBookings.length}</strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#7c3aed", marginBottom: "8px" }}>
            <CreditCard size={20} />
            <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>Total Spend</span>
          </div>
          <strong style={{ fontSize: "24px" }}>{formatETB(totalSpent)}</strong>
        </div>
      </div>

      {/* Main Sections Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "28px", alignItems: "start" }}>
        {/* Recent / Upcoming Trips */}
        <section style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", margin: 0, fontWeight: 700 }}>Your Active & Recent Trips</h2>
            <Link href="/my-bookings" style={{ fontSize: "14px", color: "var(--color-brand)", textDecoration: "none", fontWeight: 600 }}>
              View all ({myBookings.length}) →
            </Link>
          </div>

          {myBookings.length === 0 ? (
            <div style={{ padding: "36px 16px", textAlign: "center", color: "var(--color-text-muted)" }}>
              <CarFront size={40} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
              <p style={{ margin: "0 0 16px" }}>You haven&apos;t requested any rentals yet.</p>
              <Link href="/cars" style={{ background: "var(--color-brand)", color: "white", padding: "10px 18px", borderRadius: "8px", textDecoration: "none", fontWeight: 600 }}>
                Browse Available Cars
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {myBookings.slice(0, 4).map((b) => {
                const car = cars.find((c) => c.id === b.carId);
                const canTrack = ["confirmed", "in_progress"].includes(b.status);

                return (
                  <div
                    key={b.id}
                    style={{
                      border: "1px solid var(--color-border, #e5e7eb)",
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: "0 0 4px", fontSize: "16px" }}>
                        {car ? `${car.year} ${car.make} ${car.model}` : b.carId}
                      </h3>
                      <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-muted)" }}>
                        {formatDate(b.startDate)} → {formatDate(b.endDate)} · {formatETB(b.totalPrice || b.total)}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: 700,
                          padding: "4px 8px",
                          borderRadius: "6px",
                          background:
                            b.status === "confirmed" ? "#dcfce7" :
                            b.status === "completed" ? "#f1f5f9" : "#fef3c7",
                          color:
                            b.status === "confirmed" ? "#166534" :
                            b.status === "completed" ? "#475569" : "#92400e",
                        }}
                      >
                        {b.status}
                      </span>

                      {canTrack && (
                        <Link
                          href={`/bookings/${b.id}/track`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "var(--color-brand)",
                            textDecoration: "none",
                          }}
                        >
                          <Navigation size={14} /> Track
                        </Link>
                      )}

                      <Link
                        href={`/bookings/${b.id}`}
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "var(--color-text)",
                          textDecoration: "none",
                        }}
                      >
                        Details →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Actions & Profile Shortcut */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ fontSize: "16px", margin: "0 0 16px", fontWeight: 700 }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href="/cars"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "var(--color-surface-muted, #f8fafc)",
                  textDecoration: "none",
                  color: "var(--color-text)",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                <span>Browse Addis Ababa Cars</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/my-bookings"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "var(--color-surface-muted, #f8fafc)",
                  textDecoration: "none",
                  color: "var(--color-text)",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                <span>Export Bookings to CSV</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/profile"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  background: "var(--color-surface-muted, #f8fafc)",
                  textDecoration: "none",
                  color: "var(--color-text)",
                  fontWeight: 600,
                  fontSize: "14px",
                }}
              >
                <span>Edit Account Profile</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>

          <section style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)", color: "white", borderRadius: "16px", padding: "24px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "16px" }}>Earn with Sheggar Wheels</h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#94a3b8" }}>
              Have a car in Addis Ababa? List your vehicle to earn daily rental income with verified local renters.
            </p>
            <Link
              href="/owner/cars"
              style={{
                display: "inline-block",
                background: "#0066ff",
                color: "white",
                padding: "10px 18px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "14px",
              }}
            >
              List Your Car →
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
