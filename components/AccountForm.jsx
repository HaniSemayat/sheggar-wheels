"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CarFront, Eye, EyeOff } from "lucide-react";
import { getUsers } from "../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../lib/storage";
import { safeReturnPath } from "../lib/auth-utils";
import { isSupabaseConfigured, getBrowserSupabaseClient } from "../lib/supabase/client";
import styles from "./AccountForm.module.css";

export default function AccountForm({ mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || searchParams.get("next");
  const safeNext = safeReturnPath(returnTo, null);

  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("renter");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Supabase Auth when configured
    if (isSupabaseConfigured()) {
      const supabase = getBrowserSupabaseClient();
      if (supabase) {
        try {
          if (isSignup) {
            const { data, error } = await supabase.auth.signUp({
              email: normalizedEmail,
              password,
              options: {
                data: {
                  name: name.trim(),
                  phone: phone.trim(),
                  role: role === "owner" ? "owner" : "renter",
                },
              },
            });

            if (error) {
              setMessage(error.message);
              setSaving(false);
              return;
            }

            const userObj = {
              id: data.user?.id || `user-${Date.now()}`,
              name: name.trim(),
              email: normalizedEmail,
              role,
              roles: role === "owner" ? ["renter", "owner"] : ["renter"],
            };

            writeStorage("sw_current_user_v1", userObj);
            const destination = safeNext || (role === "owner" ? "/owner/cars" : "/cars");
            startTransition(() => {
              router.push(destination);
              router.refresh();
            });
            return;
          } else {
            const { data, error } = await supabase.auth.signInWithPassword({
              email: normalizedEmail,
              password,
            });

            if (error) {
              setMessage(error.message);
              setSaving(false);
              return;
            }

            // Fetch profile
            let profileRole = "renter";
            let profileRoles = ["renter"];
            let profileName = data.user.user_metadata?.name || normalizedEmail.split("@")[0];

            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", data.user.id)
                .single();

              if (profile) {
                profileRoles = profile.roles || ["renter"];
                profileRole = profileRoles.includes("admin")
                  ? "admin"
                  : profileRoles.includes("owner")
                  ? "owner"
                  : "renter";
                profileName = profile.name || profileName;
              }
            } catch {
              // Ignore profile query error
            }

            const sessionUser = {
              id: data.user.id,
              name: profileName,
              email: normalizedEmail,
              role: profileRole,
              roles: profileRoles,
            };

            writeStorage("sw_current_user_v1", sessionUser);
            const destination = safeNext || (
              profileRole === "admin"
                ? "/admin"
                : profileRole === "owner"
                ? "/owner"
                : "/cars"
            );
            startTransition(() => {
              router.push(destination);
              router.refresh();
            });
            return;
          }
        } catch (err) {
          console.warn("Supabase auth attempted, falling back to local store:", err);
        }
      }
    }

    // 2. Local Demonstration Mode Fallback
    const users = getUsers();

    if (isSignup) {
      if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
        setMessage("An account with this email already exists. Please sign in.");
        setSaving(false);
        return;
      }

      const user = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        role,
        roles: role === "owner" ? ["renter", "owner"] : ["renter"],
      };

      writeStorage(STORAGE_KEYS.users, [...users, user]);
      writeStorage("sw_current_user_v1", {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles: user.roles,
      });

      const destination = safeNext || (role === "owner" ? "/owner/cars" : "/cars");
      startTransition(() => {
        router.push(destination);
        router.refresh();
      });
      return;
    }

    // Signin in local demo mode
    const user = users.find(
      (item) => item.email.toLowerCase() === normalizedEmail
    );

    if (!user) {
      setMessage("Email not recognized. Use one of the demo accounts below or create an account.");
      setSaving(false);
      return;
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roles: Array.isArray(user.roles) ? user.roles : [user.role],
    };

    writeStorage("sw_current_user_v1", sessionUser);

    const destination = safeNext || (
      user.role === "admin"
        ? "/admin"
        : user.role === "owner"
        ? "/owner"
        : "/cars"
    );

    startTransition(() => {
      router.push(destination);
      router.refresh();
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <Link href="/" className={styles.brand}>
          <CarFront size={30} />
          <span>SHEGGAR <b>WHEELS</b></span>
        </Link>

        <p className={styles.eyebrow}>
          {isSignup ? "JOIN THE COMMUNITY" : "WELCOME BACK"}
        </p>
        <h1>{isSignup ? "Create your account" : "Sign in to Sheggar"}</h1>
        <p className={styles.subtitle}>
          {isSignup
            ? "Find your next ride or share your car with the community."
            : "Your next ride is just around the corner."}
        </p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {isSignup && (
            <>
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                />
              </label>
              <label>
                Phone number
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  autoComplete="tel"
                  required
                />
              </label>
              <label>
                I want to
                <select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="renter">Rent a car</option>
                  <option value="owner">List my car for rent</option>
                </select>
              </label>
            </>
          )}

          <label>
            Email address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <span className={styles.passwordField}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </span>
          </label>

          {message && <p className={styles.message} role="alert">{message}</p>}

          <button className={styles.submit} type="submit" disabled={saving}>
            {saving
              ? "Please wait..."
              : isSignup ? "Create account" : "Sign in"}
          </button>
        </form>

        {!isSignup && (
          <div className={styles.demo}>
            <strong>Demo accounts (instant sign in)</strong>
            {[
              ["Renter", "renter@sheggar.demo"],
              ["Owner", "owner@sheggar.demo"],
              ["Admin", "admin@sheggar.demo"],
            ].map(([label, demoEmail]) => (
              <button
                key={demoEmail}
                type="button"
                onClick={() => {
                  setEmail(demoEmail);
                  setPassword("demo123");
                  setMessage("");
                }}
              >
                Use {label} demo
              </button>
            ))}
          </div>
        )}

        <p className={styles.switch}>
          {isSignup ? "Already have an account?" : "New to Sheggar Wheels?"}{" "}
          <Link href={isSignup ? "/signin" : "/signup"}>
            {isSignup ? "Sign in" : "Create account"}
          </Link>
        </p>
        <p className={styles.disclaimer}>
          Demo application: in local mode, demo sessions are stored locally.
          Do not use sensitive personal passwords.
        </p>
      </section>
    </main>
  );
}
