
import Link from "next/link";
import { ArrowUpRight, Fuel, Users } from "lucide-react";
import styles from "./FeaturedCarCard.module.css";

export default function FeaturedCarCard({ car }) {
  return (
    <article className={styles.card}>
      <Link
        href={`/cars/${car.id}`}
        className={styles.imageLink}
        aria-label={`View details for ${car.name}`}
      >
        <div
          className={styles.image}
          style={{ backgroundImage: `url("${car.image}")` }}
          role="img"
          aria-label={car.imageAlt}
        />

        <span className={styles.badge}>{car.badge}</span>
      </Link>

      <div className={styles.body}>
        <div className={styles.titleRow}>
          <div>
            <p className={styles.make}>{car.make}</p>
            <h3 className={styles.name}>{car.name}</h3>
          </div>

          <div className={styles.price}>
            <strong>{car.price.toLocaleString("en-ET")}</strong>
            <span>ETB / day</span>
          </div>
        </div>

        <div className={styles.details}>
          <span>
            <Users size={16} aria-hidden="true" />
            {car.seats} seats
          </span>

          <span>
            <Fuel size={16} aria-hidden="true" />
            {car.fuel}
          </span>
        </div>

        <Link href={`/cars/${car.id}`} className={styles.detailsLink}>
          View details
          <ArrowUpRight size={17} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}