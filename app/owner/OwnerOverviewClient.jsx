"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Car,
  CalendarDays,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { getCars, getBookings, getReviews } from "../../lib/demo-data";
import { hasRole } from "../../lib/auth-utils";
import { formatETB, formatDate } from "../../lib/format";

const DEFAULT_OWNER_ID = "owner-001";

export default function OwnerOverviewClient() {
  const [currentUser, setCurrentUser] = useState(null);
  const [ownerId, setOwnerId] = useState(DEFAULT_OWNER_ID);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const activeUser = JSON.parse(
        window.localStorage.getItem("sw_current_user_v1") || "null"
      );
      setCurrentUser(activeUser);
      if (activeUser?.id && (activeUser.role === "owner" || (Array.isArray(activeUser.roles) && activeUser.roles.includes("owner")))) {
        setOwnerId(activeUser.id);
      }
    } catch {
      //
    }

    setCars(getCars());
    setBookings(getBookings());
    setReviews(getReviews());
    setReady(true);
  }, []);

  const isOwner = hasRole(currentUser, "owner") || (currentUser?.id === DEFAULT_OWNER_ID);

  const myCars = useMemo(() => {
    return cars.filter((c) => c.ownerId === ownerId);
  }, [cars, ownerId]);

  const myCarIds = useMemo(() => new Set(myCars.map((c) => c.id)), [myCars]);

  const myBookings = useMemo(() => {
    return bookings.filter((b) => myCarIds.has(b.carId));
  }, [bookings, myCarIds]);

  const pendingRequests = useMemo(() => {
    return myBookings.filter((b) => ["requested", "pending"].includes(b.status));
  }, [myBookings]);

  const confirmedBookings = useMemo(() => {
    return myBookings.filter((b) => ["confirmed", "in_progress"].includes(b.status));
  }, [myBookings]);

  const completedBookings = useMemo(() => {
    return myBookings.filter((b) => ["completed", "reviewed"].includes(b.status));
  }, [myBookings]);

  const totalEarnings = useMemo(() => {
    return completedBookings.reduce((sum, b) => {
      // Owner receives total minus 10% platform fee
      const subtotal = Number(b.subtotal || b.totalPrice || b.total) || 0;
      return sum + subtotal;
    }, 0);
  }, [completedBookings]);

  const myReviews = useMemo(() => {
    return reviews.filter((r) => myCarIds.has(r.carId));
  }, [reviews, myCarIds]);

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading owner hub…</div>;
  }

  if (!currentUser || !isOwner) {
    return (
      <div style={{ maxWidth: "560px", margin: "64px auto", padding: "32px", background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", textAlign: "center" }}>
        <Car size={48} style={{ color: "var(--color-brand)", marginBottom: "16px" }} />
        <h2>Owner Account Required</h2>
        <p style={{ color: "var(--color-text-muted, #6b7280)", marginBottom: "24px" }}>
          Sign in with an owner account to manage your rental fleet, respond to bookings, and track earnings.
        </p>
        <Link href="/signin?returnTo=/owner" style={{ background: "var(--color-brand)", color: "white", padding: "12px 24px", borderRadius: "8px", textDecoration: "none", fontWeight: 700 }}>
          Sign In as Owner
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "36px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand)", letterSpacing: "0.1em", margin: "0 0 6px" }}>
            OWNER FLEET MANAGEMENT
          </p>
          <h1 style={{ fontSize: "32px", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
            Owner Hub: {currentUser.name}
          </h1>
          <p style={{ color: "var(--color-text-muted, #6b7280)", margin: 0 }}>
            Fleet status, booking authorizations, and income metrics for Addis Ababa rentals.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <Link
            href="/owner/cars"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--color-brand)",
              color: "white",
              padding: "10px 18px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            <Plus size={16} /> Add / Manage Cars
          </Link>
          <Link
            href="/owner/earnings"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              border: "1px solid var(--color-border)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              padding: "10px 18px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 600,
              fontSize: "14px",
            }}
          >
            <TrendingUp size={16} /> Earnings & Analytics
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "36px" }}>
        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--color-brand)", marginBottom: "8px" }}>
            <Car size={20} />
            <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>Listed Vehicles</span>
          </div>
          <strong style={{ fontSize: "28px" }}>{myCars.length}</strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#d97706", marginBottom: "8px" }}>
            <CalendarDays size={20} />
            <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>Requests Awaiting</span>
          </div>
          <strong style={{ fontSize: "28px", color: pendingRequests.length > 0 ? "#d97706" : "inherit" }}>
            {pendingRequests.length}
          </strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#16a34a", marginBottom: "8px" }}>
            <TrendingUp size={20} />
            <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>Total Revenue</span>
          </div>
          <strong style={{ fontSize: "24px" }}>{formatETB(totalEarnings)}</strong>
        </div>

        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "12px", padding: "20px", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#7c3aed", marginBottom: "8px" }}>
            <MessageSquare size={20} />
            <span style={{ fontSize: "13px", fontWeight: 700, textTransform: "uppercase" }}>Customer Reviews</span>
          </div>
          <strong style={{ fontSize: "28px" }}>{myReviews.length}</strong>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "28px", alignItems: "start" }}>
        {/* Pending Requests & Active Bookings */}
        <section style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "18px", margin: 0, fontWeight: 700 }}>Pending Rental Requests</h2>
            <Link href="/owner/bookings" style={{ fontSize: "14px", color: "var(--color-brand)", textDecoration: "none", fontWeight: 600 }}>
              Manage all requests ({myBookings.length}) →
            </Link>
          </div>

          {pendingRequests.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--color-text-muted)" }}>
              <ShieldCheck size={36} color="#16a34a" style={{ margin: "0 auto 10px" }} />
              <p style={{ margin: 0 }}>All booking requests have been processed! No pending actions.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {pendingRequests.map((b) => {
                const car = cars.find((c) => c.id === b.carId);
                return (
                  <div
                    key={b.id}
                    style={{
                      border: "1px solid #fed7aa",
                      background: "#fffaf5",
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

                    <Link
                      href="/owner/bookings"
                      style={{
                        background: "#d97706",
                        color: "white",
                        padding: "8px 14px",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontWeight: 600,
                        textDecoration: "none",
                      }}
                    >
                      Respond Now
                    </Link>
                  </div>
                );
              })}
            </div>
          )}

          {/* Fleet Summary Table */}
          <div style={{ marginTop: "32px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px" }}>Your Vehicle Fleet ({myCars.length})</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {myCars.map((car) => (
                <div
                  key={car.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "var(--color-surface-muted, #f8fafc)",
                  }}
                >
                  <div>
                    <strong>{car.year} {car.make} {car.model}</strong>
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)", marginLeft: "8px" }}>
                      · {car.location} · {formatETB(car.pricePerDay)}/day
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: car.status === "approved" || car.status === "available" ? "#dcfce7" : "#fef3c7",
                        color: car.status === "approved" || car.status === "available" ? "#166534" : "#92400e",
                      }}
                    >
                      {car.status || "available"}
                    </span>
                    <Link
                      href={`/owner/cars/${car.id}/availability`}
                      style={{ fontSize: "13px", color: "var(--color-brand)", textDecoration: "none" }}
                    >
                      Blackout Dates
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Owner Quick Navigation Menu */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <section style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "24px" }}>
            <h2 style={{ fontSize: "16px", margin: "0 0 16px", fontWeight: 700 }}>Owner Navigation</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Link
                href="/owner/cars"
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
                <span>Car Fleet & Add Listing</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/owner/bookings"
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
                <span>Rental Bookings ({myBookings.length})</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/owner/earnings"
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
                <span>Earnings Chart & CSV Export</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/owner/reviews"
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
                <span>Customer Reviews ({myReviews.length})</span>
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/owner/disputes"
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
                <span>Disputes & Claims</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
