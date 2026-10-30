"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Star, MessageSquare, CornerDownRight, CheckCircle2 } from "lucide-react";
import { getCars, getReviews } from "../../../lib/demo-data";
import { replyToReview } from "../../../lib/data-service";
import { formatDate } from "../../../lib/format";

const DEFAULT_OWNER_ID = "owner-001";

export default function OwnerReviewsClient() {
  const [ownerId, setOwnerId] = useState(DEFAULT_OWNER_ID);
  const [currentUser, setCurrentUser] = useState(null);
  const [cars, setCars] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [replyInputs, setReplyInputs] = useState({});
  const [successMsg, setSuccessMsg] = useState("");
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
    setReviews(getReviews());
    setReady(true);
  }, []);

  const myCars = useMemo(() => cars.filter((c) => c.ownerId === ownerId), [cars, ownerId]);
  const myCarIds = useMemo(() => new Set(myCars.map((c) => c.id)), [myCars]);

  const ownerReviews = useMemo(() => {
    return reviews.filter((r) => myCarIds.has(r.carId));
  }, [reviews, myCarIds]);

  async function handleSendReply(reviewId) {
    const text = replyInputs[reviewId];
    if (!text || !text.trim()) return;

    try {
      await replyToReview(reviewId, text.trim(), currentUser || { id: ownerId, role: "owner" });
      setReviews(getReviews());
      setReplyInputs((prev) => ({ ...prev, [reviewId]: "" }));
      setSuccessMsg("Your owner reply has been published!");
      setTimeout(() => setSuccessMsg(""), 3500);
    } catch (err) {
      alert(err.message || "Could not publish reply.");
    }
  }

  if (!ready) {
    return <div style={{ padding: "64px", textAlign: "center" }}>Loading reviews…</div>;
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
          CUSTOMER FEEDBACK
        </p>
        <h1 style={{ fontSize: "32px", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Vehicle Reviews ({ownerReviews.length})
        </h1>
        <p style={{ color: "var(--color-text-muted, #6b7280)", margin: 0 }}>
          Read verified renter feedback on your vehicles and respond directly to customers.
        </p>
      </header>

      {successMsg && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "#f0fdf4", border: "1px solid #86efac", color: "#166534", padding: "14px 18px", borderRadius: "8px", marginBottom: "24px" }}>
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {ownerReviews.length === 0 ? (
        <div style={{ background: "var(--color-surface, #fff)", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "16px", padding: "48px 24px", textAlign: "center" }}>
          <MessageSquare size={44} style={{ color: "var(--color-text-muted)", opacity: 0.5, margin: "0 auto 12px" }} />
          <h3>No Reviews Yet</h3>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            When renters complete trips in your cars, their ratings and reviews will appear here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {ownerReviews.map((rev) => {
            const car = cars.find((c) => c.id === rev.carId);
            return (
              <article
                key={rev.id}
                style={{
                  background: "var(--color-surface, #fff)",
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: "14px",
                  padding: "24px",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <strong style={{ fontSize: "16px" }}>
                      {car ? `${car.year} ${car.make} ${car.model}` : "Vehicle"}
                    </strong>
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)", marginLeft: "8px" }}>
                      · {formatDate(rev.createdAt)}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "4px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={18}
                        fill={rev.rating >= star ? "#f59e0b" : "none"}
                        color={rev.rating >= star ? "#f59e0b" : "#d1d5db"}
                      />
                    ))}
                  </div>
                </div>

                <p style={{ fontSize: "15px", lineHeight: "1.6", margin: "0 0 16px" }}>
                  "{rev.comment}"
                </p>

                {/* Existing Reply */}
                {rev.ownerReply ? (
                  <div
                    style={{
                      display: "flex",
                      gap: "12px",
                      background: "var(--color-surface-muted, #f8fafc)",
                      padding: "16px",
                      borderRadius: "10px",
                      borderLeft: "3px solid var(--color-brand)",
                    }}
                  >
                    <CornerDownRight size={18} style={{ color: "var(--color-brand)", flexShrink: 0, marginTop: "2px" }} />
                    <div>
                      <strong style={{ fontSize: "13px", color: "var(--color-text)" }}>Your Reply:</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "14px", color: "var(--color-text-muted)" }}>
                        {rev.ownerReply}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-border, #e5e7eb)" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px" }}>
                      Reply to this customer review:
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
                        placeholder="Thank the customer or address feedback..."
                        value={replyInputs[rev.id] || ""}
                        onChange={(e) =>
                          setReplyInputs((prev) => ({ ...prev, [rev.id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => handleSendReply(rev.id)}
                        style={{
                          background: "var(--color-brand)",
                          color: "white",
                          border: "none",
                          padding: "10px 18px",
                          borderRadius: "8px",
                          fontWeight: 600,
                          fontSize: "14px",
                          cursor: "pointer",
                        }}
                      >
                        Publish Reply
                      </button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
