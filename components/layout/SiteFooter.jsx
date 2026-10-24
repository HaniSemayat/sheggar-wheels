
import Link from "next/link";
import { CarFront } from "lucide-react";
import { connection } from "next/server";
import styles from "./SiteFooter.module.css";

export default async function SiteFooter() {
  await connection();

  return (
    <footer className={styles["site-footer"]}>
      <div className={`container ${styles["site-footer-inner"]}`}>
        <Link href="/" className={`site-brand ${styles["footer-brand"]}`}>
          <CarFront size={28} strokeWidth={2.5} aria-hidden="true" />
          <span>
            SHEGGAR{" "}
            <span className={styles["brand-accent"]}>WHEELS</span>
          </span>
        </Link>

        <p className={styles["footer-tagline"]}>
          Better cars. A brighter tomorrow.
        </p>

        <p className={styles["footer-note"]}>
          Frontend demonstration project. Bookings and payments are simulated.
        </p>

        <p className={styles["footer-copyright"]}>
          © {new Date().getFullYear()} Sheggar Wheels
        </p>
      </div>
    </footer>
  );
}
