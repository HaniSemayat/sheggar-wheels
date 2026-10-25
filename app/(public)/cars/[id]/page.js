
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Fuel,
  MapPin,
  Users,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { demoCars } from "../../../../data/cars";
import CarPhotoGallery from "../../../../components/cars/CarPhotoGallery";
import styles from "./CarDetails.module.css";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const car = demoCars.find((item) => item.id === id);

  return {
    title: car
      ? `${car.year} ${car.make} ${car.model} | Sheggar Wheels`
      : "Car Not Found | Sheggar Wheels",
    description:
      car?.description ?? "Explore car rentals in Addis Ababa.",
  };
}

function CarDetailsFallback() {
  return (
    <div className={styles.page}>
      <div className={styles.container} aria-busy="true">
        Loading vehicle details…
      </div>
    </div>
  );
}

async function CarDetailsContent({ params }) {
  const { id } = await params;
  const car = demoCars.find((item) => item.id === id);

  if (!car) {
    notFound();
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
            <p className={styles.eyebrow}>
              {car.category} <span>·</span> {car.year}
            </p>

            <h1>
              {car.make} {car.model}
            </h1>

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
                <div>
                  <span>Capacity</span>
                  <strong>{car.seats} seats</strong>
                </div>
              </div>

              <div className={styles.specification}>
                <Settings2 size={21} aria-hidden="true" />
                <div>
                  <span>Transmission</span>
                  <strong>{car.transmission}</strong>
                </div>
              </div>

              <div className={styles.specification}>
                <Fuel size={21} aria-hidden="true" />
                <div>
                  <span>Fuel type</span>
                  <strong>{car.fuel}</strong>
                </div>
              </div>

              <div className={styles.specification}>
                <CalendarDays size={21} aria-hidden="true" />
                <div>
                  <span>Model year</span>
                  <strong>{car.year}</strong>
                </div>
              </div>
            </div>

            <div className={styles.locationCard}>
              <MapPin size={20} aria-hidden="true" />
              <div>
                <strong>Pickup location</strong>
                <p>{car.location}, Addis Ababa, Ethiopia</p>
              </div>
            </div>
          </section>

          <aside className={styles.bookingCard}>
            <p className={styles.eyebrow}>YOUR NEXT RIDE</p>

            <p className={styles.price}>
              <strong>
                {car.pricePerDay.toLocaleString("en-ET")}
              </strong>
              <span>ETB / day</span>
            </p>

            <div className={styles.bookingDivider} />

            <div className={styles.bookingNote}>
              <ShieldCheck size={20} aria-hidden="true" />
              <p>
                Demo listing. Booking functionality is coming next.
              </p>
            </div>

            <button
              className={styles.bookingButton}
              type="button"
              disabled
            >
              Booking coming soon
            </button>

            <p className={styles.demoNote}>
              <span>Demo data</span> · No payment will be collected.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function CarDetailsPage({ params }) {
  return (
    <Suspense fallback={<CarDetailsFallback />}>
      <CarDetailsContent params={params} />
    </Suspense>
  );
}
