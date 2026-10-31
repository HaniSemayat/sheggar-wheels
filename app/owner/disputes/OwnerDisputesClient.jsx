"use client";

import { startTransition, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { getCars, getBookings } from "../../../lib/demo-data";
import { readStorage } from "../../../lib/storage";
import { formatDate } from "../../../lib/format";

const DEFAULT_OWNER_ID = "owner-001";

export default function OwnerDisputesClient() {
  const [ownerId, setOwnerId] = useState(DEFAULT_OWNER_ID);
  const [cars, setCars] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startTransition(() => {
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
    const storedDisputes = readStorage("sw_disputes_v1", [
      {
        id: "disp-001",
        bookingId: "booking-001",
        openedBy: "renter-001",
        reason: "Vehicle fuel gauge discrepancy upon pickup",
        description: "The tank was 3/4 full instead of full at pickup in Bole.",
        status: "resolved",
        resolutionNotes: "Owner provided ETB 400 fuel credit courtesy voucher.",
        createdAt: "2026-10-12T14:00:00Z",
      },
    ]);
    setDisputes(storedDisputes);
    setReady(true);
    });
  }, []);

  const myCars = useMemo(() => cars.filter((c) => c.ownerId === ownerId), [cars, ownerId]);
  const myCarIds = useMemo(() => new Set(myCars.map((c) => c.id)), [myCars]);
  const myBookingIds = useMemo(() => {
    return new Set(bookings.filter((b) => myCarIds.has(b.carId)).map((b) => b.id));
  }, [bookings, myCarIds]);

  const ownerDisputes = useMemo(() => {
    return disputes.filter((d) => myBookingIds.has(d.bookingId) || d.openedBy === ownerId);
  }, [disputes, myBookingIds, ownerId]);

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading disputes…</div>;
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "36px 20px" }}>
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

      <header style={{ marginBottom: "32px" }}>
        <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand)", letterSpacing: "0.1em", margin: "0 0 6px" }}>
          RESOLUTION CENTER
        </p>
        <h1 style={{ fontSize: "32px", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Fleet Disputes & Claims ({ownerDisputes.length})
        </h1>
        <p style={{ color: "var(--color-text-muted, #6b7280)", margin: 0 }}>
          Manage customer claims, mediate condition reports, and view administrative resolutions.
        </p>
      </header>

      {ownerDisputes.length === 0 ? (
        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "48px 24px", textAlign: "center" }}>
          <CheckCircle2 size={44} color="#16a34a" style={{ margin: "0 auto 12px" }} />
          <h3>No Active Disputes</h3>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            Your fleet has a clean record with zero customer claims or unresolved issues.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {ownerDisputes.map((d) => (
            <article
              key={d.id}
              style={{
                background: "var(--color-surface, #fff)",
                border: "1px solid var(--color-border, #e5e7eb)",
                borderRadius: "14px",
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <strong style={{ fontSize: "16px" }}>Claim: {d.reason}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>
                    Booking Ref: {d.bookingId} · Opened on {formatDate(d.createdAt)}
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: "999px",
                    background: d.status === "resolved" ? "#dcfce7" : "#fee2e2",
                    color: d.status === "resolved" ? "#166534" : "#991b1b",
                  }}
                >
                  {d.status === "resolved" ? "Resolved" : "Open Investigation"}
                </span>
              </div>

              <p style={{ fontSize: "14px", margin: "0 0 16px", color: "var(--color-text)" }}>
                {d.description}
              </p>

              {d.resolutionNotes && (
                <div style={{ background: "var(--color-surface-muted, #f8fafc)", padding: "14px", borderRadius: "8px", borderLeft: "3px solid #16a34a" }}>
                  <strong style={{ fontSize: "13px", color: "#166534" }}>Admin Resolution:</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--color-text)" }}>
                    {d.resolutionNotes}
                  </p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
