"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UserRound,
  CalendarDays,
  LayoutDashboard,
  ShieldAlert,
  Car,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { hasRole } from "../../lib/auth-utils";
import { isSupabaseConfigured, getBrowserSupabaseClient } from "../../lib/supabase/client";
import styles from "./SiteHeader.module.css";

const navigation = [
  { label: "Home", href: "/" },
  { label: "Browse Cars", href: "/cars" },
  { label: "My Bookings", href: "/my-bookings" },
  { label: "List Your Car", href: "/owner/cars" },
];

export default function SiteHeader() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef(null);
  const headerRef = useRef(null);

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

      if (headerRef.current && !headerRef.current.contains(event.target)) {
        setMobileNavOpen(false);
      }
    }

    function closeOnEscape(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setMobileNavOpen(false);
      }
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function handleSignOut() {
    if (isSupabaseConfigured()) {
      const supabase = getBrowserSupabaseClient();
      if (supabase) {
        try {
          await supabase.auth.signOut();
        } catch {
          // Ignore
        }
      }
    }

    window.localStorage.removeItem("sw_current_user_v1");
    window.dispatchEvent(
      new CustomEvent("sheggar-storage-change", {
        detail: { key: "sw_current_user_v1" },
      })
    );
    setUser(null);
    setMenuOpen(false);
    router.push("/");
    router.refresh();
  }

  const displayName = user?.name || user?.username || "Account";
  const initial = displayName.trim().charAt(0).toUpperCase() || "U";
  const isAdmin = hasRole(user, "admin");
  const isOwner = hasRole(user, "owner");

  return (
    <header className={styles["site-header"]}>
      <div ref={headerRef} className={`container ${styles["site-header-inner"]}`}>
        <Link
          href="/"
          className={`site-brand ${styles["site-brand"]}`}
          aria-label="Sheggar Wheels home"
        >
          <span>
            SHEGGAR{" "}
            <span className={styles["brand-accent"]}>WHEELS</span>
          </span>
        </Link>

        <nav
          id="mobile-navigation"
          className={`${styles["site-nav"]} ${mobileNavOpen ? styles["site-nav-open"] : ""}`}
          aria-label="Main navigation"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles["site-nav-link"]}
              onClick={() => setMobileNavOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles["site-header-actions"]}>
          <button
            type="button"
            className={styles["mobile-nav-toggle"]}
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileNavOpen((open) => !open)}
          >
            {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
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
              </button>

              {menuOpen && (
                <div className={styles["account-dropdown"]} role="menu">
                  <div className={styles["account-dropdown-heading"]}>
                    <strong>{displayName}</strong>
                    <span>{user.email || ""}</span>
                  </div>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      role="menuitem"
                      className={styles["account-dropdown-link"]}
                      onClick={() => setMenuOpen(false)}
                    >
                      <ShieldAlert size={17} />
                      Admin Console
                    </Link>
                  )}

                  {isOwner && (
                    <Link
                      href="/owner"
                      role="menuitem"
                      className={styles["account-dropdown-link"]}
                      onClick={() => setMenuOpen(false)}
                    >
                      <Car size={17} />
                      Owner Hub
                    </Link>
                  )}

                  <Link
                    href="/dashboard"
                    role="menuitem"
                    className={styles["account-dropdown-link"]}
                    onClick={() => setMenuOpen(false)}
                  >
                    <LayoutDashboard size={17} />
                    Renter Dashboard
                  </Link>

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
