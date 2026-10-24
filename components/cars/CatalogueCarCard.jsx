
"use client";

import { useState } from "react";
import Link from "next/link";
import { CarFront, Fuel, MapPin, Users } from "lucide-react";
import styles from "./CatalogueCarCard.module.css";

export default function CatalogueCarCard({ car }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = car.photos?.front;

  return (
    <article className={styles.card}>
      <Link
        href={`/cars/${car.id}`}
        className={styles.imageLink}
        aria-label={`View ${car.make} ${car.model} ${car.year}`}
      >
        {image && !imageFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={`${car.year} ${car.make} ${car.model}`}
            className={styles.image}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={styles.placeholder}>
            <CarFront size={54} strokeWidth={1.2} />
            <span>Vehicle photo coming soon</span>
          </div>
        )}

        <span className={styles.category}>{car.category}</span>
      </Link>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <div className={styles.title}>
            <p className={styles.make}>{car.make}</p>
            <h3>{car.model}</h3>
            <p className={styles.year}>{car.year}</p>
          </div>

          <div className={styles.price}>
            <strong>{car.pricePerDay.toLocaleString("en-ET")}</strong>
            <span>ETB / day</span>
          </div>
        </div>

        <div className={styles.location}>
          <MapPin size={15} aria-hidden="true" />
          {car.location}, Addis Ababa
        </div>

        <div className={styles.details}>
          <span><Users size={16} /> {car.seats} seats</span>
          <span><Fuel size={16} /> {car.fuel}</span>
          <span>{car.transmission}</span>
        </div>

        <Link href={`/cars/${car.id}`} className={styles.detailsLink}>
          View car details <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}
