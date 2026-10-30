
"use client";

import Image from "next/image";
import { useState } from "react";
import styles from "./CarPhotoGallery.module.css";

const photoViews = [
  { key: "front", label: "Front view" },
  { key: "side", label: "Side view" },
  { key: "rear", label: "Rear view" },
];

export default function CarPhotoGallery({ car }) {
  const [failedPhotos, setFailedPhotos] = useState([]);

  return (
    <section className={styles.gallery} aria-label="Vehicle photos">
      {photoViews.map(({ key, label }, index) => {
        const src = car.photos?.[key];
        const failed = !src || failedPhotos.includes(key);

        return (
          <div
            className={`${styles.photo} ${index === 0 ? styles.mainPhoto : ""}`}
            key={key}
          >
            {!failed && (
              <Image
                src={src}
                alt={`${car.year} ${car.make} ${car.model} — ${label}`}
                fill
                sizes={
                  index === 0
                    ? "(max-width: 600px) 100vw, 60vw"
                    : "(max-width: 600px) 50vw, 30vw"
                }
                className={styles.vehicleImage}
                onError={() =>
                  setFailedPhotos((previous) =>
                    previous.includes(key) ? previous : [...previous, key]
                  )
                }
              />
            )}

            {failed && (
              <div className={styles.photoPlaceholder}>
                <span className={styles.photoIcon}>✳</span>
                <span>{label}</span>
                <small>Vehicle photo coming soon</small>
              </div>
            )}

            <span className={styles.photoLabel}>{label}</span>
          </div>
        );
      })}
    </section>
  );
}
