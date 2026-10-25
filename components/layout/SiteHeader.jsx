
import Link from "next/link";
import { CarFront } from "lucide-react";
import styles from "./SiteHeader.module.css";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Browse Cars", href: "/cars" },
  { label: "My Bookings", href: "/my-bookings" },
  { label: "Sell Your Car", href: "/owner/cars/new" },
];

export default function SiteHeader() {
  return (
    <header className={styles["site-header"]}>
      <div className={`container ${styles["site-header-inner"]}`}>
        <Link
          href="/"
          className={`site-brand ${styles["site-brand"]}`}
          aria-label="Sheggar Wheels home"
        >
          <CarFront size={30} strokeWidth={2.5} aria-hidden="true" />
          <span>
            SHEGGAR{" "}
            <span className={styles["brand-accent"]}>WHEELS</span>
          </span>
        </Link>

        <nav className={styles["site-nav"]} aria-label="Main navigation">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles["site-nav-link"]}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles["site-header-actions"]}>
          <Link href="/signin" className={styles["header-signin"]}>
            Sign in
          </Link>

          <Link
            href="/signup"
            className={`button button-primary ${styles["header-signup"]}`}
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}

