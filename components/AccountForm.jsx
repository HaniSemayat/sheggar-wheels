"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CarFront, Eye, EyeOff } from "lucide-react";
import { getUsers } from "../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../lib/storage";
import styles from "./AccountForm.module.css";

export default function AccountForm({ mode }) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("renter");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSaving(true);

    const users = getUsers();
    const normalizedEmail = email.trim().toLowerCase();

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
        password,
        phone: phone.trim(),
        role,
      };

      if (!writeStorage(STORAGE_KEYS.users, [...users, user])) {
        setMessage("Could not create your account. Please try again.");
        setSaving(false);
        return;
      }

      writeStorage("sw_current_user_v1", {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      });

      router.push(role === "owner" ? "/owner/cars" : "/cars");
      router.refresh();
      return;
    }

    const user = users.find(
      (item) =>
        item.email.toLowerCase() === normalizedEmail &&
        item.password === password
    );

    if (!user) {
      setMessage("Email or password is incorrect.");
      setSaving(false);
      return;
    }

    writeStorage("sw_current_user_v1", {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    router.push(user.role === "admin" ? "/admin" : user.role === "owner" ? "/owner/cars" : "/cars");
    router.refresh();
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
                <input value={name} onChange={(e) => setName(e.target.value)}
                  autoComplete="name" required minLength={2} />
              </label>
              <label>
                Phone number
                <input value={phone} onChange={(e) => setPhone(e.target.value)}
                  type="tel" autoComplete="tel" required />
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
            <input type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email" required />
          </label>

          <label>
            Password
            <span className={styles.passwordField}>
              <input type={showPassword ? "text" : "password"}
                value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={6} required />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}>
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
            <strong>Demo accounts (password: demo123)</strong>
            {[
              ["Renter", "renter@sheggar.demo"],
              ["Owner", "owner@sheggar.demo"],
              ["Admin", "admin@sheggar.demo"],
            ].map(([label, demoEmail]) => (
              <button key={demoEmail} type="button" onClick={() => {
                setEmail(demoEmail);
                setPassword("demo123");
                setMessage("");
              }}>
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
          Demo application: account information is stored in this browser.
          Do not use a real password.
        </p>
      </section>
    </main>
  );
}


