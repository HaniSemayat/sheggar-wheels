"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, CheckCircle2 } from "lucide-react";
import { readStorage, writeStorage } from "../../../lib/storage";
import { formatDate } from "../../../lib/format";

export default function AdminDisputesClient() {
  const [disputes, setDisputes] = useState([]);
  const [resolutionInput, setResolutionInput] = useState({});
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const list = readStorage("sw_disputes_v1", [
      {
        id: "disp-001",
        bookingId: "booking-001",
        openedBy: "renter-001",
        reason: "Vehicle fuel gauge discrepancy upon pickup",
        description: "The tank was 3/4 full instead of full at pickup in Bole.",
        status: "open",
        createdAt: "2026-10-12T14:00:00Z",
      },
    ]);
    setDisputes(list);
    setReady(true);
  }, []);

  function handleResolve(disputeId) {
    const notes = resolutionInput[disputeId] || "Resolved following administrator mediation.";
    const updated = disputes.map((d) =>
      d.id === disputeId
        ? {
            ...d,
            status: "resolved",
            resolutionNotes: notes,
            resolvedAt: new Date().toISOString(),
          }
        : d
    );
    writeStorage("sw_disputes_v1", updated);
    setDisputes(updated);
    setMsg("Dispute marked as resolved with official notes.");
    setTimeout(() => setMsg(""), 3500);
  }

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading disputes…</div>;
  }

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "36px 20px" }}>
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

      <header style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand)", letterSpacing: "0.1em", margin: "0 0 6px" }}>
          CUSTOMER SUPPORT & MEDIATION
        </p>
        <h1 style={{ fontSize: "30px", margin: "0 0 8px" }}>Dispute Resolution Center</h1>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          Mediate issues between renters and vehicle owners and issue binding resolutions.
        </p>
      </header>

      {msg && (
        <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
          {msg}
        </div>
      )}

      {disputes.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", padding: "24px 0" }}>No disputes recorded.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {disputes.map((d) => (
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
                  <strong style={{ fontSize: "16px" }}>{d.reason}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--color-text-muted)" }}>
                    Booking Ref: {d.bookingId} · Opened by {d.openedBy} on {formatDate(d.createdAt)}
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
                  {d.status === "resolved" ? "Resolved" : "Open Dispute"}
                </span>
              </div>

              <p style={{ fontSize: "14px", margin: "0 0 16px" }}>
                {d.description}
              </p>

              {d.status === "resolved" ? (
                <div style={{ background: "var(--color-surface-muted, #f8fafc)", padding: "14px", borderRadius: "8px", borderLeft: "3px solid #16a34a" }}>
                  <strong style={{ fontSize: "13px", color: "#166534" }}>Official Resolution Notes:</strong>
                  <p style={{ margin: "4px 0 0", fontSize: "13px" }}>
                    {d.resolutionNotes}
                  </p>
                </div>
              ) : (
                <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-border, #e5e7eb)" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                    Resolution Notes & Action Taken:
                  </label>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <input
                      type="text"
                      style={{
                        flex: 1,
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--color-border, #d1d5db)",
                        fontSize: "14px",
                      }}
                      placeholder="e.g. Refund issued, fuel credit settled..."
                      value={resolutionInput[d.id] || ""}
                      onChange={(e) =>
                        setResolutionInput((prev) => ({ ...prev, [d.id]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      onClick={() => handleResolve(d.id)}
                      style={{
                        background: "#16a34a",
                        color: "white",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: "8px",
                        fontWeight: 600,
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      Resolve Dispute
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
