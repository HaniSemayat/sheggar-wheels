"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CarFront,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  AlertCircle,
} from "lucide-react";
import { getCars, getBookings } from "../../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../../lib/storage";
import { calculateRentalDays, formatETB, formatDate } from "../../lib/format";
import { hasBookingConflict, calculateBookingTotals } from "../../lib/booking";
import { isSupabaseConfigured, getBrowserSupabaseClient } from "../../lib/supabase/client";
import styles from "./Checkout.module.css";

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const carId = searchParams.get("carId");
  const paramStartDate = searchParams.get("startDate");
  const paramEndDate = searchParams.get("endDate");

  const [cars, setCars] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [telebirrPhone, setTelebirrPhone] = useState("+251911000001");
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [completedBooking, setCompletedBooking] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const allCars = getCars();
    setCars(allCars);

    try {
      const activeUser = JSON.parse(
        window.localStorage.getItem("sw_current_user_v1") || "null"
      );
      setCurrentUser(activeUser);
      if (activeUser?.phone) {
        setTelebirrPhone(activeUser.phone);
      }
    } catch {
      setCurrentUser(null);
    }

    setReady(true);
  }, []);

  const selectedCar = useMemo(() => {
    if (!cars.length) return null;
    return cars.find((c) => c.id === carId) || cars[0];
  }, [cars, carId]);

  // Default dates if none provided
  const today = new Date();
  const defaultStart = new Date(today.getTime() + 86400000).toISOString().split("T")[0];
  const defaultEnd = new Date(today.getTime() + 86400000 * 3).toISOString().split("T")[0];

  const startDate = paramStartDate || defaultStart;
  const endDate = paramEndDate || defaultEnd;

  const days = useMemo(() => {
    return calculateRentalDays(startDate, endDate);
  }, [startDate, endDate]);

  const pricing = useMemo(() => {
    if (!selectedCar) return { subtotal: 0, platformFee: 0, total: 0 };
    return calculateBookingTotals(selectedCar.pricePerDay, startDate, endDate);
  }, [selectedCar, startDate, endDate]);

  async function handleTelebirrPayment() {
    setErrorMsg("");

    if (!currentUser) {
      router.push(`/signin?returnTo=${encodeURIComponent(`/checkout?carId=${selectedCar.id}&startDate=${startDate}&endDate=${endDate}`)}`);
      return;
    }

    if (currentUser.id === selectedCar.ownerId) {
      setErrorMsg("You cannot book your own vehicle listing.");
      return;
    }

    if (days < 1) {
      setErrorMsg("Please select valid rental dates.");
      return;
    }

    // Check conflict
    const allBookings = getBookings();
    if (hasBookingConflict(allBookings, selectedCar.id, startDate, endDate)) {
      setErrorMsg("This vehicle is already booked for these dates. Please choose different dates.");
      return;
    }

    setProcessing(true);

    // Simulate TeleBirr API communication
    await new Promise((resolve) => setTimeout(resolve, 1400));

    const txRef = `TB-ETH-${Date.now().toString(36).toUpperCase()}`;
    const newBooking = {
      id: `booking-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      carId: selectedCar.id,
      renterId: currentUser.id,
      ownerId: selectedCar.ownerId,
      startDate,
      endDate,
      days,
      pricePerDay: selectedCar.pricePerDay,
      subtotal: pricing.subtotal,
      platformFee: pricing.platformFee,
      totalPrice: pricing.total,
      status: "confirmed",
      paymentStatus: "demo_paid",
      paymentMethod: "telebirr",
      telebirrReference: txRef,
      telebirrPhone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to storage
    writeStorage(STORAGE_KEYS.bookings, [newBooking, ...allBookings]);

    // Save to Supabase if configured
    if (isSupabaseConfigured()) {
      const supabase = getBrowserSupabaseClient();
      if (supabase) {
        try {
          await supabase.from("bookings").insert({
            id: newBooking.id,
            car_id: selectedCar.id,
            renter_id: currentUser.id,
            owner_id: selectedCar.ownerId,
            start_date: startDate,
            end_date: endDate,
            days,
            price_per_day: selectedCar.pricePerDay,
            subtotal: pricing.subtotal,
            platform_fee: pricing.platformFee,
            total: pricing.total,
            status: "confirmed",
            payment_status: "demo_paid",
          });
        } catch (e) {
          console.warn("Supabase booking insert notice:", e);
        }
      }
    }

    setProcessing(false);
    setCompletedBooking(newBooking);
  }

  if (!ready || !selectedCar) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <p>Preparing secure checkout…</p>
        </div>
      </main>
    );
  }

  if (completedBooking) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={`${styles.card} ${styles.successReceipt}`}>
            <CheckCircle2 size={64} className={styles.successIcon} />
            <p className={styles.eyebrow}>PAYMENT SUCCESSFUL</p>
            <h2>Booking Confirmed!</h2>
            <p>Your TeleBirr transaction was processed and your car is reserved.</p>

            <div className={styles.receiptDetails}>
              <div className={styles.receiptRow}>
                <span>Vehicle:</span>
                <strong>{selectedCar.year} {selectedCar.make} {selectedCar.model}</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>Pickup Location:</span>
                <strong>{selectedCar.location}, Addis Ababa</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>Rental Dates:</span>
                <strong>{formatDate(startDate)} to {formatDate(endDate)} ({days} days)</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>Total Paid:</span>
                <strong>{formatETB(completedBooking.totalPrice)}</strong>
              </div>
              <div className={styles.receiptRow}>
                <span>TeleBirr Reference:</span>
                <code>{completedBooking.telebirrReference}</code>
              </div>
              <div className={styles.receiptRow}>
                <span>Booking ID:</span>
                <code>{completedBooking.id}</code>
              </div>
            </div>

            <div className={styles.actionRow}>
              <Link href={`/bookings/${completedBooking.id}/track`} className={styles.primaryBtn}>
                Track Simulated Trip →
              </Link>
              <Link href="/my-bookings" className={styles.secondaryBtn}>
                View All My Bookings
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href={`/cars/${selectedCar.id}`} className={styles.backLink}>
          <ArrowLeft size={16} /> Back to vehicle details
        </Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>CHECKOUT & PAYMENT</p>
          <h1>Complete Your Reservation</h1>
          <p>Review trip details and complete your demo booking with TeleBirr.</p>
        </header>

        <div className={styles.grid}>
          {/* Left Column: Payment & Renter Info */}
          <div>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <Smartphone size={20} />
                TeleBirr Payment Gateway
              </h2>

              <div className={styles.telebirrBox}>
                <div className={styles.telebirrHeader}>
                  <strong style={{ fontSize: "16px", color: "#166534" }}>telebirr</strong>
                  <span className={styles.telebirrBadge}>ETHIO TELECOM DEMO</span>
                </div>
                <p style={{ margin: "0 0 10px", fontSize: "13px", color: "#166534" }}>
                  Fast and secure local mobile payment in Ethiopian Birr (ETB).
                </p>

                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1f2937" }}>
                  TeleBirr Account Number / Mobile:
                  <input
                    type="tel"
                    className={styles.telebirrInput}
                    value={telebirrPhone}
                    onChange={(e) => setTelebirrPhone(e.target.value)}
                    placeholder="+251 9... or 09..."
                    required
                  />
                </label>

                <button
                  type="button"
                  className={styles.payButton}
                  onClick={handleTelebirrPayment}
                  disabled={processing}
                >
                  <CreditCard size={18} />
                  {processing ? "Contacting TeleBirr..." : `Pay ${formatETB(pricing.total)} with TeleBirr`}
                </button>

                <p className={styles.demoTag}>
                  Simulated sandbox environment · No real money is deducted.
                </p>
              </div>

              {errorMsg && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", color: "#dc2626", background: "#fef2f2", padding: "12px", borderRadius: "8px", fontSize: "14px" }}>
                  <AlertCircle size={18} />
                  <span>{errorMsg}</span>
                </div>
              )}
            </section>

            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <ShieldCheck size={20} />
                Renter Information
              </h2>
              {currentUser ? (
                <div>
                  <p style={{ margin: "0 0 6px" }}>
                    Signed in as: <strong>{currentUser.name}</strong> ({currentUser.email})
                  </p>
                  <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "14px" }}>
                    Account role: {currentUser.role}
                  </p>
                </div>
              ) : (
                <div>
                  <p style={{ margin: "0 0 12px", color: "var(--color-text-muted)" }}>
                    You are not signed in. Please sign in or use a demo account to book.
                  </p>
                  <Link
                    href={`/signin?returnTo=${encodeURIComponent(`/checkout?carId=${selectedCar.id}&startDate=${startDate}&endDate=${endDate}`)}`}
                    className={styles.primaryBtn}
                  >
                    Sign in to Continue
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <div>
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>
                <CarFront size={20} />
                Trip Summary
              </h2>

              <div className={styles.carSummary}>
                <img
                  src={
                    typeof selectedCar.photos === "object" && selectedCar.photos !== null
                      ? selectedCar.photos.front || Object.values(selectedCar.photos)[0] || "/images/cars/toyota-corolla-2022/front.jpg"
                      : "/images/cars/toyota-corolla-2022/front.jpg"
                  }
                  alt={`${selectedCar.make} ${selectedCar.model}`}
                />
                <div className={styles.carInfo}>
                  <h3>{selectedCar.year} {selectedCar.make} {selectedCar.model}</h3>
                  <p>{selectedCar.category} · {selectedCar.transmission}</p>
                  <p style={{ color: "var(--color-brand)", fontWeight: 600 }}>
                    Pickup: {selectedCar.location}, Addis Ababa
                  </p>
                </div>
              </div>

              <div className={styles.datesGrid}>
                <div className={styles.dateBlock}>
                  <span>Pickup</span>
                  <strong>{formatDate(startDate)}</strong>
                </div>
                <div className={styles.dateBlock}>
                  <span>Return</span>
                  <strong>{formatDate(endDate)}</strong>
                </div>
              </div>

              <h3 style={{ fontSize: "14px", margin: "16px 0 8px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-text-muted)" }}>
                Cost Breakdown
              </h3>

              <ul className={styles.costBreakdown}>
                <li className={styles.costRow}>
                  <span>Daily Rate:</span>
                  <strong>{formatETB(selectedCar.pricePerDay)} / day</strong>
                </li>
                <li className={styles.costRow}>
                  <span>Duration:</span>
                  <strong>{days} {days === 1 ? "day" : "days"}</strong>
                </li>
                <li className={styles.costRow}>
                  <span>Subtotal:</span>
                  <strong>{formatETB(pricing.subtotal)}</strong>
                </li>
                <li className={styles.costRow}>
                  <span>Sheggar Wheels Fee (10%):</span>
                  <strong>{formatETB(pricing.platformFee)}</strong>
                </li>
                <li className={styles.costTotal}>
                  <span>Total Amount:</span>
                  <span>{formatETB(pricing.total)}</span>
                </li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
