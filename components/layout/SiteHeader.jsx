
"use client";

import { useEffect, useState } from "react";
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
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refreshUser = () => {
      try {
        setUser(
          JSON.parse(
            window.localStorage.getItem("sw_current_user_v1") || "null"
          )
        );
      } catch {
        setUser(null);
      }
      setReady(true);
    };

    refreshUser();
    window.addEventListener("sheggar-storage-change", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.removeEventListener("sheggar-storage-change", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  function handleSignOut() {
    window.localStorage.removeItem("sw_current_user_v1");
    window.dispatchEvent(
      new CustomEvent("sheggar-storage-change", {
        detail: { key: "sw_current_user_v1" },
      })
    );
    setUser(null);
    window.location.href = "/";
  }

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
          {ready && user ? (
            <>
              <Link href="/profile" className={styles["header-signin"]}>
                Profile
              </Link>
              <button
                type="button"
                className={`button button-primary ${styles["header-signup"]}`}
                onClick={handleSignOut}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/signin" className={styles["header-signin"]}>
                Sign in
              </Link>
              <Link
                href="/signup"
                className={`button button-primary ${styles["header-signup"]}`}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
