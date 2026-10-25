"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getCars } from "../../../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../../../lib/storage";
import styles from "./OwnerCars.module.css";

const DEFAULT_OWNER_ID = "owner-001";

const emptyForm = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  pricePerDay: "",
  transmission: "Automatic",
  fuel: "Petrol",
  seats: 5,
  location: "Bole",
  category: "Economy",
  description: "",
};

export default function OwnerCars() {
  const [cars, setCars] = useState([]);
  const [ownerId, setOwnerId] = useState(DEFAULT_OWNER_ID);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [ready, setReady] = useState(false);

    useEffect(() => {
      // Intentional: hydrate the owner dashboard from persisted browser data.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Load persisted cars on mount.
      setCars(getCars());
      const activeUser = window.localStorage.getItem("sw_current_user_v1");
      if (activeUser) {
        try {
          const parsedUser = JSON.parse(activeUser);
          if (parsedUser.role === "owner") setOwnerId(parsedUser.id);
        } catch {}
      }
      setReady(true);
    }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
    setMessage("");
  }

  function editCar(car) {
    setEditingId(car.id);
    setForm({
      make: car.make,
      model: car.model,
      year: car.year,
      pricePerDay: car.pricePerDay,
      transmission: car.transmission,
      fuel: car.fuel,
      seats: car.seats,
      location: car.location,
      category: car.category,
      description: car.description,
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    const make = form.make.trim();
    const model = form.model.trim();
    const location = form.location.trim();
    const description = form.description.trim();
    const year = Number(form.year);
    const pricePerDay = Number(form.pricePerDay);
    const seats = Number(form.seats);

    if (!make || !model || !location || !description) {
      setMessage("Please complete all required fields.");
      return;
    }

    if (
      !Number.isInteger(year) ||
      year < 1990 ||
      year > new Date().getFullYear() + 1 ||
      !Number.isFinite(pricePerDay) ||
      pricePerDay <= 0 ||
      !Number.isInteger(seats) ||
      seats < 2 ||
      seats > 50
    ) {
      setMessage("Check the year, daily price, and seat count.");
      return;
    }

    const existing = editingId
      ? cars.find((car) => car.id === editingId)
      : null;

    const slug = `${make}-${model}-${year}`
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const id = editingId || `${slug}-${Date.now()}`;

    const updatedCar = {
      ...(existing || {}),
      id,
      make,
      model,
      year,
      pricePerDay,
      transmission: form.transmission,
      fuel: form.fuel,
      seats,
      location,
      category: form.category,
      description,
      status: existing?.status || "available",
      moderationStatus: existing?.moderationStatus || (editingId ? "approved" : "pending"),
      ownerId: existing?.ownerId || ownerId,
      photos: existing?.photos || {
        front: "",
        side: "",
        rear: "",
      },
    };

    const nextCars = editingId
      ? cars.map((car) => (car.id === editingId ? updatedCar : car))
      : [updatedCar, ...cars];

    if (!writeStorage(STORAGE_KEYS.cars, nextCars)) {
      setMessage("Could not save. Check your browser storage settings.");
      return;
    }

    setCars(nextCars);
    setMessage(editingId ? "Listing updated successfully." : "Car added successfully.");
    setForm(emptyForm);
    setEditingId(null);
  }

  const myCars = cars.filter((car) => car.ownerId === ownerId || (ownerId === DEFAULT_OWNER_ID && car.ownerId === "user-owner-01"));

  if (!ready) {
    return <main className={styles.page}><p>Loading your listings...</p></main>;
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link href="/cars" className={styles.backLink}>← Browse all cars</Link>

        <header className={styles.header}>
          <p className={styles.eyebrow}>OWNER WORKSPACE · DEMO</p>
          <h1>Manage your cars</h1>
          <p>Add a vehicle to the marketplace or update one of your existing listings.</p>
        </header>

        <section className={styles.panel}>
          <h2>{editingId ? "Edit listing" : "Add a car"}</h2>

          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              Make *
              <input name="make" value={form.make} onChange={updateField} required maxLength={50} placeholder="Toyota" />
            </label>

            <label>
              Model *
              <input name="model" value={form.model} onChange={updateField} required maxLength={60} placeholder="Corolla" />
            </label>

            <label>
              Year *
              <input name="year" type="number" value={form.year} onChange={updateField} min="1990" max={new Date().getFullYear() + 1} required />
            </label>

            <label>
              Daily price (ETB) *
              <input name="pricePerDay" type="number" value={form.pricePerDay} onChange={updateField} min="1" step="1" required placeholder="2500" />
            </label>

            <label>
              Location *
              <input name="location" value={form.location} onChange={updateField} required maxLength={80} placeholder="Bole" />
            </label>

            <label>
              Seats *
              <input name="seats" type="number" value={form.seats} onChange={updateField} min="2" max="50" required />
            </label>

            <label>
              Transmission
              <select name="transmission" value={form.transmission} onChange={updateField}>
                <option>Automatic</option>
                <option>Manual</option>
              </select>
            </label>

            <label>
              Fuel
              <select name="fuel" value={form.fuel} onChange={updateField}>
                <option>Petrol</option>
                <option>Diesel</option>
                <option>Hybrid</option>
                <option>Electric</option>
              </select>
            </label>

            <label>
              Category
              <select name="category" value={form.category} onChange={updateField}>
                <option>Economy</option>
                <option>Compact</option>
                <option>SUV</option>
                <option>Van</option>
                <option>Luxury</option>
                <option>Luxury SUV</option>
                <option>Premium SUV</option>
              </select>
            </label>

            <label className={styles.fullWidth}>
              Description *
              <textarea name="description" value={form.description} onChange={updateField} required maxLength={500} rows={4} placeholder="Describe the car and what makes it useful..." />
            </label>

            {message && (
              <p className={styles.message} role="status">{message}</p>
            )}

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton}>
                {editingId ? "Save changes" : "Add car listing"}
              </button>
              {editingId && (
                <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                  Cancel editing
                </button>
              )}
            </div>
          </form>
        </section>

        <section className={styles.listings}>
          <div className={styles.listingsHeading}>
            <div>
              <h2>Your listings</h2>
              <p>{myCars.length} cars owned by the demo account</p>
            </div>
          </div>

          {myCars.length === 0 ? (
            <p className={styles.empty}>You have not added any cars yet.</p>
          ) : (
            <div className={styles.list}>
              {myCars.map((car) => (
                <article className={styles.carRow} key={car.id}>
                  <div>
                    <h3>{car.year} {car.make} {car.model}</h3>
                    <p>{car.location} · {car.transmission} · {car.seats} seats</p>
                    <strong>{car.pricePerDay.toLocaleString()} ETB / day</strong>
                  </div>
                  <button type="button" className={styles.secondaryButton} onClick={() => editCar(car)}>
                    Edit
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}





