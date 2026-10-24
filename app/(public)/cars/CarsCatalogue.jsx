
"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import CatalogueCarCard from "../../../components/cars/CatalogueCarCard";
import styles from "./CarsCatalogue.module.css";


export default function CarsCatalogue({ cars }) {
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("All locations");
  const [transmission, setTransmission] = useState("All");
  const [minSeats, setMinSeats] = useState("Any");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("recommended");
  const [showFilters, setShowFilters] = useState(false);

  const locations = useMemo(
    () => [...new Set(cars.map((car) => car.location))].sort(),
    [cars],
  );

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = cars.filter((car) => {
      const searchableText =
        `${car.make} ${car.model} ${car.year} ${car.description} ${car.location}`.toLowerCase();

      return (
        searchableText.includes(query) &&
        (location === "All locations" || car.location === location) &&
        (transmission === "All" ||
          car.transmission === transmission) &&
        (minSeats === "Any" || car.seats >= Number(minSeats)) &&
        (maxPrice === "" ||
          car.pricePerDay <= Number(maxPrice))
      );
    });

    if (sort === "price-low") {
      result.sort((a, b) => a.pricePerDay - b.pricePerDay);
    } else if (sort === "price-high") {
      result.sort((a, b) => b.pricePerDay - a.pricePerDay);
    } else if (sort === "newest") {
      result.sort((a, b) => b.year - a.year);
    }

    return result;
  }, [
    cars,
    search,
    location,
    transmission,
    minSeats,
    maxPrice,
    sort,
  ]);

  function resetFilters() {
    setSearch("");
    setLocation("All locations");
    setTransmission("All");
    setMinSeats("Any");
    setMaxPrice("");
    setSort("recommended");
  }

  const hasFilters =
    search !== "" ||
    location !== "All locations" ||
    transmission !== "All" ||
    minSeats !== "Any" ||
    maxPrice !== "";

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className="container">
          <p className={styles.eyebrow}>FIND YOUR NEXT RIDE</p>
          <h1>Find the right car for your journey.</h1>
          <p className={styles.intro}>
            Explore cars across Addis Ababa, compare daily rates,
            and find a ride that fits your plans.
          </p>

          <label className={styles.searchBox}>
            <Search size={20} aria-hidden="true" />
            <span className={styles.visuallyHidden}>
              Search cars
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search make, model, year or location..."
            />
            {search && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </label>
        </div>
      </section>

      <section className={`container ${styles.catalogue}`}>
        <div className={styles.toolbar}>
          <div>
            <h2>Available cars</h2>
            <p className={styles.resultCount}>
              {filteredCars.length} of {cars.length} demo listings
            </p>
          </div>

          <div className={styles.toolbarActions}>
            <button
              type="button"
              className={styles.filterToggle}
              onClick={() => setShowFilters((current) => !current)}
              aria-expanded={showFilters}
            >
              <SlidersHorizontal size={17} />
              {showFilters ? "Hide filters" : "Filters"}
            </button>

            <label className={styles.sortControl}>
              <span>Sort by</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option value="recommended">Recommended</option>
                <option value="price-low">Price: low to high</option>
                <option value="price-high">Price: high to low</option>
                <option value="newest">Newest year</option>
              </select>
            </label>
          </div>
        </div>

        {showFilters && (
          <div className={styles.filters}>
            <label>
              <span>Location</span>
              <select
                value={location}
                onChange={(event) => setLocation(event.target.value)}
              >
                <option>All locations</option>
                {locations.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Transmission</span>
              <select
                value={transmission}
                onChange={(event) =>
                  setTransmission(event.target.value)
                }
              >
                <option>All</option>
                <option>Automatic</option>
                <option>Manual</option>
              </select>
            </label>

            <label>
              <span>Minimum seats</span>
              <select
                value={minSeats}
                onChange={(event) => setMinSeats(event.target.value)}
              >
                <option value="Any">Any</option>
                <option value="5">5+ seats</option>
                <option value="7">7+ seats</option>
                <option value="12">12+ seats</option>
              </select>
            </label>

            <label>
              <span>Maximum daily price (ETB)</span>
              <input
                type="number"
                min="0"
                value={maxPrice}
                onChange={(event) => setMaxPrice(event.target.value)}
                placeholder="e.g. 5000"
              />
            </label>

            {hasFilters && (
              <button
                type="button"
                className={styles.resetButton}
                onClick={resetFilters}
              >
                <X size={15} />
                Clear filters
              </button>
            )}
          </div>
        )}

        {filteredCars.length > 0 ? (
          <div className={styles.grid}>
            {filteredCars.map((car) => (
              <CatalogueCarCard key={car.id} car={car} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <Search size={30} aria-hidden="true" />
            <h3>No cars match your search</h3>
            <p>Try another search or adjust your filters.</p>
            <button
              type="button"
              className={styles.resetButton}
              onClick={resetFilters}
            >
              Clear search and filters
            </button>
          </div>
        )}

        <p className={styles.demoNotice}>
          Demo listings · Prices and availability are illustrative,
          not confirmed rental offers.
        </p>
      </section>
    </div>
  );
}
