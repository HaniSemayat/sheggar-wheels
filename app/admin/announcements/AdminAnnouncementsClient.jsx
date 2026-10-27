"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Megaphone, Plus, CheckCircle2, ToggleLeft, ToggleRight } from "lucide-react";
import { readStorage, writeStorage } from "../../../lib/storage";
import { formatDate } from "../../../lib/format";

export default function AdminAnnouncementsClient() {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const list = readStorage("sw_announcements_v1", [
      {
        id: "ann-001",
        title: "Welcome to Sheggar Wheels",
        message: "Explore Addis Ababa with verified peer-to-peer car rentals. All bookings feature demo transactions.",
        active: true,
        createdAt: "2026-10-25T10:00:00Z",
      },
      {
        id: "ann-002",
        title: "Bole District Expansion",
        message: "More than 8 new listings are now available across Bole and Kazanchis.",
        active: true,
        createdAt: "2026-10-26T12:00:00Z",
      },
    ]);
    setAnnouncements(list);
    setReady(true);
  }, []);

  function handleCreate(e) {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    const newAnn = {
      id: `ann-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    };

    const updated = [newAnn, ...announcements];
    writeStorage("sw_announcements_v1", updated);
    setAnnouncements(updated);
    setTitle("");
    setMessage("");
    setMsg("Announcement successfully published to the platform.");
    setTimeout(() => setMsg(""), 3500);
  }

  function handleToggle(id) {
    const updated = announcements.map((a) =>
      a.id === id ? { ...a, active: !a.active } : a
    );
    writeStorage("sw_announcements_v1", updated);
    setAnnouncements(updated);
  }

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading announcements…</div>;
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
          COMMUNICATIONS
        </p>
        <h1 style={{ fontSize: "30px", margin: "0 0 8px" }}>Platform Announcements</h1>
        <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
          Broadcast marketplace alerts, policy updates, and service notices to all users.
        </p>
      </header>

      {msg && (
        <div style={{ background: "#ecfdf5", border: "1px solid #10b981", color: "#065f46", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px" }}>
          {msg}
        </div>
      )}

      {/* Create Announcement Form */}
      <section style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "24px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", margin: "0 0 16px", fontWeight: 700 }}>Publish New Announcement</h2>
        <form onSubmit={handleCreate}>
          <label style={{ display: "block", marginBottom: "14px", fontSize: "14px", fontWeight: 600 }}>
            Headline / Title:
            <input
              type="text"
              style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--color-border, #d1d5db)", marginTop: "6px", fontSize: "14px", boxSizing: "border-box" }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Holiday Rental Operations Notice"
              required
            />
          </label>

          <label style={{ display: "block", marginBottom: "18px", fontSize: "14px", fontWeight: 600 }}>
            Announcement Message:
            <textarea
              style={{ width: "100%", minHeight: "90px", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--color-border, #d1d5db)", marginTop: "6px", fontSize: "14px", boxSizing: "border-box" }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Detailed notice content..."
              required
            />
          </label>

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
            <Plus size={16} /> Broadcast Announcement
          </button>
        </form>
      </section>

      {/* Announcements List */}
      <h2 style={{ fontSize: "18px", margin: "0 0 16px", fontWeight: 700 }}>Published Notices ({announcements.length})</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {announcements.map((a) => (
          <article
            key={a.id}
            style={{
              background: "var(--color-surface, #fff)",
              border: "1px solid var(--color-border, #e5e7eb)",
              borderRadius: "12px",
              padding: "20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <strong style={{ fontSize: "16px" }}>{a.title}</strong>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    background: a.active ? "#dcfce7" : "#f1f5f9",
                    color: a.active ? "#166534" : "#475569",
                  }}
                >
                  {a.active ? "LIVE / ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <p style={{ margin: "0 0 6px", fontSize: "14px", color: "var(--color-text)" }}>{a.message}</p>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                Created on {formatDate(a.createdAt)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleToggle(a.id)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                borderRadius: "6px",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {a.active ? <ToggleRight size={18} color="#16a34a" /> : <ToggleLeft size={18} color="#94a3b8" />}
              {a.active ? "Deactivate" : "Activate"}
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
