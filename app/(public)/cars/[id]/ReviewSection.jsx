"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare, Send } from "lucide-react";
import { getBookings, getReviews } from "../../../../lib/demo-data";
import { writeStorage, STORAGE_KEYS } from "../../../../lib/storage";
import styles from "./ReviewSection.module.css";

const dateLabel = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Recently"
    : date.toLocaleDateString("en-ET", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
};

export default function ReviewSection({ carId }) {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => {
      let activeUser = null;

      try {
        activeUser = JSON.parse(
          window.localStorage.getItem("sw_current_user_v1") || "null"
        );
      } catch {
        activeUser = null;
      }

      setUser(activeUser);
      setBookings(getBookings());
      setReviews(getReviews());
      setReady(true);
    };

    refresh();
    window.addEventListener("sheggar-storage-change", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("sheggar-storage-change", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const carReviews = reviews
    .filter((review) => review.carId === carId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const average = carReviews.length
    ? carReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      carReviews.length
    : 0;

  const eligibleBookings = bookings.filter(
    (booking) =>
      booking.carId === carId &&
      booking.renterId === user?.id &&
      booking.status === "completed" &&
      !reviews.some((review) => review.bookingId === booking.id)
  );

  function submitReview(event) {
    event.preventDefault();
    setMessage("");

    if (!user || user.role !== "renter") {
      setMessage("Sign in with a renter account to leave a review.");
      return;
    }

    const booking = eligibleBookings[0];

    if (!booking) {
      setMessage("You need a completed booking without an existing review.");
      return;
    }

    const trimmed = comment.trim();

    if (trimmed.length < 8) {
      setMessage("Please write at least 8 characters about your experience.");
      return;
    }

    const latestReviews = getReviews();

    if (latestReviews.some((review) => review.bookingId === booking.id)) {
      setReviews(latestReviews);
      setMessage("This booking has already been reviewed.");
      return;
    }

    const review = {
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      carId,
      renterId: user.id,
      bookingId: booking.id,
      rating,
      comment: trimmed,
      createdAt: new Date().toISOString(),
    };

    const saved = writeStorage(STORAGE_KEYS.reviews, [
      ...latestReviews,
      review,
    ]);

    if (!saved) {
      setMessage("Could not save your review. Please try again.");
      return;
    }

    setComment("");
    setRating(5);
    setMessage("Thanks! Your review has been saved.");
    setReviews(getReviews());
  }

  return (
    <section className={styles.section} aria-labelledby="reviews-heading">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>RENTER EXPERIENCES</p>
          <h2 id="reviews-heading">Reviews and ratings</h2>
          <p className={styles.subtitle}>
            Feedback from renters who have used this vehicle.
          </p>
        </div>

        <div className={styles.summary}>
          <Star size={21} fill="currentColor" />
          <strong>{carReviews.length ? average.toFixed(1) : "—"}</strong>
          <span>
            {carReviews.length} {carReviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>

      {ready && user?.role === "renter" && eligibleBookings.length > 0 && (
        <form className={styles.form} onSubmit={submitReview}>
          <h3>Share your experience</h3>
          <label className={styles.label}>Your rating</label>
          <div className={styles.ratingPicker} aria-label="Choose a rating">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                className={`${styles.starButton} ${
                  value <= rating ? styles.selectedStar : ""
                }`}
                onClick={() => setRating(value)}
                aria-label={`${value} star${value === 1 ? "" : "s"}`}
                aria-pressed={rating === value}
              >
                <Star size={25} fill={value <= rating ? "currentColor" : "none"} />
              </button>
            ))}
            <span>{rating} out of 5</span>
          </div>

          <label className={styles.label} htmlFor={`review-${carId}`}>
            Your review
          </label>
          <textarea
            id={`review-${carId}`}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="How was the car, pickup, and overall experience?"
            rows={4}
            maxLength={1000}
            required
          />
          <div className={styles.formFooter}>
            <span>{comment.length}/1000</span>
            <button type="submit" className={styles.submitButton}>
              <Send size={16} /> Submit review
            </button>
          </div>
          {message && <p className={styles.message} role="status">{message}</p>}
        </form>
      )}

      {ready && user?.role === "renter" && eligibleBookings.length === 0 && (
        <p className={styles.notice}>
          Reviews can be submitted after a completed rental.
        </p>
      )}

      {ready && !user && (
        <p className={styles.notice}>
          Sign in as a renter and complete a booking to review this vehicle.
        </p>
      )}

      {ready && carReviews.length === 0 && (
        <div className={styles.empty}>
          <MessageSquare size={25} />
          <strong>No reviews yet</strong>
          <p>Be the first renter to share feedback about this vehicle.</p>
        </div>
      )}

      {carReviews.length > 0 && (
        <div className={styles.reviewList}>
          {carReviews.map((review) => (
            <article className={styles.review} key={review.id}>
              <div className={styles.reviewTop}>
                <div className={styles.avatar} aria-hidden="true">
                  {String(review.renterId || "R").slice(0, 1).toUpperCase()}
                </div>
                <div className={styles.reviewer}>
                  <strong>Verified renter</strong>
                  <span>{dateLabel(review.createdAt)}</span>
                </div>
                <div
                  className={styles.reviewStars}
                  aria-label={`${review.rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star
                      key={index}
                      size={15}
                      fill={index < Number(review.rating) ? "currentColor" : "none"}
                    />
                  ))}
                </div>
              </div>
              <p className={styles.comment}>{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
