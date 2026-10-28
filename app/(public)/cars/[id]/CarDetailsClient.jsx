"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Fuel,
  MapPin,
  Users,
  Settings2,
} from "lucide-react";
import { demoCars } from "../../../../data/cars";
import { getCars } from "../../../../lib/demo-data";
import CarPhotoGallery from "../../../../components/cars/CarPhotoGallery";
import BookingForm from "../../../../components/bookings/BookingForm";
import ReviewSection from "./ReviewSection";
import styles from "./CarDetails.module.css";
import dynamic from "next/dynamic";

const CarLocationMap = dynamic(
  () => import("../../../../components/cars/CarLocationMap"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: "260px",
          background: "var(--color-surface, #f9fafb)",
          borderRadius: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--color-text-muted, #6b7280)",
          border: "1px solid var(--color-border, #e5e7eb)",
          marginTop: "16px",
        }}
      >
        Loading location map…
      </div>
    ),
  }
);

export default function CarDetailsClient({ id }) {
  const [car, setCar] = useState(() => demoCars.find((item) => item.id === id) || null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refreshCars = () => {
      const found = getCars().find((item) => item.id === id);
      setCar(found || demoCars.find((item) => item.id === id) || null);
      setReady(true);
    };

    refreshCars();
    window.addEventListener("sheggar-storage-change", refreshCars);
    window.addEventListener("storage", refreshCars);

    return () => {
      window.removeEventListener("sheggar-storage-change", refreshCars);
      window.removeEventListener("storage", refreshCars);
    };
  }, [id]);

  if (!ready && !car) {
    return <div className={styles.page}><div className={styles.container}>Loading vehicle details…</div></div>;
  }

  if (!car) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <h1>Car not found</h1>
          <p>This listing may have been removed or is no longer available.</p>
          <Link href="/cars" className={styles.backLink}>Back to all cars</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link href="/cars" className={styles.backLink}>
          <ArrowLeft size={18} aria-hidden="true" />
          Back to all cars
        </Link>

        <div className={styles.heading}>
          <div>
            <p className={styles.eyebrow}>{car.category} <span>·</span> {car.year}</p>
            <h1>{car.make} {car.model}</h1>
            <p className={styles.subtitle}>
              <MapPin size={17} aria-hidden="true" />
              {car.location}, Addis Ababa
            </p>
          </div>
          <span className={styles.status}>
            <span className={styles.statusDot} />
            {car.status === "available" ? "Available" : car.status}
          </span>
        </div>

        <CarPhotoGallery car={car} />

        <div className={styles.content}>
          <section className={styles.information}>
            <div className={styles.sectionHeading}>
              <p className={styles.eyebrow}>THE VEHICLE</p>
              <h2>Everything you need to know</h2>
            </div>
            <p className={styles.description}>{car.description}</p>
            <div className={styles.specifications}>
              <div className={styles.specification}>
                <Users size={21} aria-hidden="true" />
                <div><span>Capacity</span><strong>{car.seats} seats</strong></div>
              </div>
              <div className={styles.specification}>
                <Settings2 size={21} aria-hidden="true" />
                <div><span>Transmission</span><strong>{car.transmission}</strong></div>
              </div>
              <div className={styles.specification}>
                <Fuel size={21} aria-hidden="true" />
                <div><span>Fuel type</span><strong>{car.fuel}</strong></div>
              </div>
              <div className={styles.specification}>
                <CalendarDays size={21} aria-hidden="true" />
                <div><span>Model year</span><strong>{car.year}</strong></div>
              </div>
            </div>
            <div className={styles.locationCard}>
              <MapPin size={20} aria-hidden="true" />
              <div>
                <strong>Pickup location</strong>
                <p>{car.location}, Addis Ababa, Ethiopia</p>
              </div>
            </div>
            <CarLocationMap
              location={car.location}
              title={`${car.year} ${car.make} ${car.model}`}
              latitude={car.latitude}
              longitude={car.longitude}
            />
          </section>

          <aside className={styles.bookingCard}>
            <p className={styles.eyebrow}>YOUR NEXT RIDE</p>
            <p className={styles.price}>
              <strong>{Number(car.pricePerDay).toLocaleString("en-ET")}</strong>
              <span>ETB / day</span>
            </p>
            <div className={styles.bookingDivider} />
            <BookingForm car={car} />
            <p className={styles.demoNote}>
              <span>Demo data</span> · No payment will be collected.
            </p>
          </aside>
        </div>

        <ReviewSection carId={car.id} />
      </div>
    </div>
  );
}
