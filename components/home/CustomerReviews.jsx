
import { Star, UserRound } from "lucide-react";
import styles from "./CustomerReviews.module.css";

const reviews = [
  {
    id: 1,
    name: "Hayat M.",
    location: "Addis Ababa",
    text: "The booking process felt simple, and finding a car for my plans was easy. I like having different options in one place.",
  },
  {
    id: 2,
    name: "Hagos G.",
    location: "Addis Ababa",
    text: "I love the idea of choosing between affordable everyday cars and more premium rides depending on the occasion.",
  },
  {
    id: 3,
    name: "Andarge T.",
    location: "Addis Ababa",
    text: "A useful concept for people who need a car and owners who want to make their vehicles available to others.",
  },
];

export default function CustomerReviews() {
  return (
    <section className={styles.reviews} aria-labelledby="reviews-heading">
      <div className={`container ${styles.inner}`}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>COMMUNITY VOICES</p>

          <h2 id="reviews-heading">
            Good journeys start with confidence.
          </h2>

          <p className={styles.description}>
            See what our sample renters value about the Sheggar Wheels experience.
          </p>
        </div>

        <div className={styles.grid}>
          {reviews.map((review) => (
            <article className={styles.card} key={review.id}>
              <div className={styles.stars} aria-label="Sample five-star rating">
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    size={17}
                    fill="currentColor"
                    aria-hidden="true"
                  />
                ))}
              </div>

              <p className={styles.quote}>“{review.text}”</p>

              <div className={styles.reviewer}>
                <div className={styles.avatar} aria-hidden="true">
                  <UserRound size={20} />
                </div>

                <div>
                  <h3>{review.name}</h3>
                  <p>{review.location} · Sample renter</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <p className={styles.disclaimer}>
          Illustrative sample reviews for this demo. Not actual customer testimonials.
        </p>
      </div>
    </section>
  );
}
