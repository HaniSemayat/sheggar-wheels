
import Link from "next/link";
import styles from "./page.module.css";

const heroSlides = [
  {
    image: "/images/hero/city-sedan.jpg",
    alt: "A sedan ready for a city drive",
  },
  {
    image: "/images/hero/road-trip.jpg",
    alt: "An SUV ready for a road trip",
  },
  {
    image: "/images/hero/premium-ride.jpg",
    alt: "A premium car in an urban setting",
  },
];

export default function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.slides} aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.image}
              className={`${styles.slide} ${
                index === 0 ? styles.active : ""
              }`}
              style={{ backgroundImage: `url("${slide.image}")` }}
            />
          ))}
        </div>

        <div className={styles.overlay} />

        <div className={`container ${styles.content}`}>
          <p className={styles.eyebrow}>YOUR JOURNEY, YOUR WAY</p>

          <h1>Find your perfect ride in Addis Ababa.</h1>

          <p className={styles.description}>
            From everyday drives to unforgettable journeys, find a car
            that fits your plans.
          </p>

          <div className={styles.actions}>
            <Link href="/cars" className="button button-primary">
              Browse cars
            </Link>

            <Link
              href="/owner/cars/new"
              className={`button button-secondary ${styles.secondaryButton}`}
            >
              List your car
            </Link>
          </div>

          <p className={styles.note}>
            Your next journey starts here.
          </p>
        </div>

        <div className={styles.slideIndicators} aria-hidden="true">
          <span className={styles.indicatorActive} />
          <span />
          <span />
        </div>
      </section>

      <section className={styles.intro}>
        <div className={`container ${styles.introInner}`}>
          <p className={styles.introEyebrow}>THE RIGHT CAR FOR YOU</p>

          <h2>
            From everyday drives to extraordinary journeys.
          </h2>

          <p className={styles.introDescription}>
            Looking for an affordable city car, a comfortable ride
            for the family, or something a little more premium?
            Explore options for different needs, styles, and budgets
            with Sheggar Wheels.
          </p>

          <Link
            href="/cars"
            className={`button button-primary ${styles.introButton}`}
          >
            Explore available cars
          </Link>
        </div>
      </section>
    </>
  );
}
