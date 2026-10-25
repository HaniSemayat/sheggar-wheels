
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CarFront, ChevronDown, UserRound, CalendarDays, LogOut } from "lucide-react";
import styles from "./SiteHeader.module.css";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Browse Cars", href: "/cars" },
  { label: "My Bookings", href: "/my-bookings" },
  { label: "Sell Your Car", href: "/owner/cars" },
];

export default function SiteHeader() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

    const timer = window.setTimeout(refreshUser, 0);
    window.addEventListener("sheggar-storage-change", refreshUser);
    window.addEventListener("storage", refreshUser);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("sheggar-storage-change", refreshUser);
      window.removeEventListener("storage", refreshUser);
    };
  }, []);

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
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
    setMenuOpen(false);
    router.push("/");
  }

  const displayName = user?.name || user?.username || "Account";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";

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
            <div className={styles["account-menu"]} ref={menuRef}>
              <button
                type="button"
                className={styles["account-trigger"]}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <span className={styles["account-avatar"]} aria-hidden="true">
                  {initial}
                </span>
                <span className={styles["account-name"]}>{displayName}</span>
                <ChevronDown size={16} aria-hidden="true" />
              </button>

              {menuOpen && (
                <div className={styles["account-dropdown"]} role="menu">
                  <div className={styles["account-dropdown-heading"]}>
                    <strong>{displayName}</strong>
                    <span>{user.email || ""}</span>
                  </div>

                  <Link
                    href="/profile"
                    role="menuitem"
                    className={styles["account-dropdown-link"]}
                    onClick={() => setMenuOpen(false)}
                  >
                    <UserRound size={17} />
                    My Profile
                  </Link>

                  <Link
                    href="/my-bookings"
                    role="menuitem"
                    className={styles["account-dropdown-link"]}
                    onClick={() => setMenuOpen(false)}
                  >
                    <CalendarDays size={17} />
                    My Bookings
                  </Link>

                  <button
                    type="button"
                    role="menuitem"
                    className={styles["account-dropdown-link"]}
                    onClick={handleSignOut}
                  >
                    <LogOut size={17} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            ready && (
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
            )
          )}
        </div>
      </div>
    </header>
  );
}

