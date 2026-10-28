"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, User, ShieldCheck, ShieldAlert, CheckCircle2, UserX } from "lucide-react";
import { getUsers } from "../../../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../../../lib/storage";

export default function AdminUsersClient() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUsers(getUsers());
    setReady(true);
  }, []);

  function handleToggleStatus(userId) {
    const updated = users.map((u) => {
      if (u.id === userId) {
        const nextStatus = u.status === "suspended" ? "active" : "suspended";
        return { ...u, status: nextStatus };
      }
      return u;
    });

    writeStorage(STORAGE_KEYS.users, updated);
    setUsers(updated);
    setMsg("User status updated successfully.");
    setTimeout(() => setMsg(""), 3000);
  }

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading user accounts…</div>;
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

      <header style={{ marginBottom: "28px" }}>
        <p style={{ fontSize: "12px", fontWeight: 800, color: "var(--color-brand)", letterSpacing: "0.1em", margin: "0 0 6px" }}>
          MEMBERSHIP DIRECTORY
        </p>
        <h1 style={{ fontSize: "30px", margin: "0 0 8px" }}>User & Identity Management</h1>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          Manage renter and owner profiles, oversee verification, and enforce account suspensions.
        </p>
      </header>

      {msg && (
        <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
          {msg}
        </div>
      )}

      <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid var(--color-border, #e5e7eb)" }}>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>Name / Email</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>Phone</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>Roles</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>Status</th>
              <th style={{ padding: "14px 16px", color: "var(--color-text-muted)", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const status = u.status || "active";
              const isSuspended = status === "suspended";
              const roles = Array.isArray(u.roles) ? u.roles : [u.role || "renter"];

              return (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--color-border, #e5e7eb)" }}>
                  <td style={{ padding: "14px 16px" }}>
                    <strong style={{ display: "block" }}>{u.name}</strong>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{u.email}</span>
                  </td>
                  <td style={{ padding: "14px 16px", color: "var(--color-text-muted)" }}>
                    {u.phone || "Not provided"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {roles.map((r) => (
                        <span
                          key={r}
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: r === "admin" ? "#fee2e2" : r === "owner" ? "#fef3c7" : "#e0f2fe",
                            color: r === "admin" ? "#991b1b" : r === "owner" ? "#92400e" : "#0369a1",
                            textTransform: "uppercase",
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: isSuspended ? "#fee2e2" : "#dcfce7",
                        color: isSuspended ? "#991b1b" : "#166534",
                      }}
                    >
                      {status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px", textAlign: "right" }}>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(u.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: isSuspended ? "1px solid #16a34a" : "1px solid #dc2626",
                        background: isSuspended ? "#f0fdf4" : "#fef2f2",
                        color: isSuspended ? "#166534" : "#dc2626",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {isSuspended ? "Reinstate Account" : "Suspend Account"}
                    </button>
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
