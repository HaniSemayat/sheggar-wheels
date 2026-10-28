"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserRound, Mail, ShieldCheck, ArrowLeft } from "lucide-react";
import styles from "./Profile.module.css";

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadUser = () => {
      try {
        const stored = window.localStorage.getItem("sw_current_user_v1");
        setUser(stored ? JSON.parse(stored) : null);
      } catch {
        setUser(null);
      } finally {
        setReady(true);
      }
    };

    const timer = window.setTimeout(loadUser, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready && !user) router.replace("/signin");
  }, [ready, user, router]);

  if (!ready || !user) {
    return <main className={styles.page}>Loading profile…</main>;
  }

  const initials = user.name
    ? user.name
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/cars" className={styles.backLink}>
          <ArrowLeft size={16} /> Back to cars
        </Link>

        <section className={styles.card}>
          <div className={styles.avatar} aria-hidden="true">
            {initials || <UserRound size={36} />}
          </div>

          <p className={styles.eyebrow}>YOUR ACCOUNT</p>
          <h1>{user.name}</h1>
          <p className={styles.subtitle}>Your Sheggar Wheels profile</p>

          <div className={styles.details}>
            <div className={styles.detail}>
              <Mail size={20} />
              <div>
                <span>Email address</span>
                <strong>{user.email}</strong>
              </div>
            </div>
            <div className={styles.detail}>
              <ShieldCheck size={20} />
              <div>
                <span>Account type</span>
                <strong>
                  {user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Renter"}
                </strong>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={styles.signOut}
            onClick={() => {
              window.localStorage.removeItem("sw_current_user_v1");
              window.dispatchEvent(
                new CustomEvent("sheggar-storage-change", {
                  detail: { key: "sw_current_user_v1" },
                })
              );
              router.replace("/");
            }}
          >
            Sign out
          </button>
        </section>
      </div>
    </main>
  );
}
