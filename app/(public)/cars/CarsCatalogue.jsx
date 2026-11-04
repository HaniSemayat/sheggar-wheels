"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getCars } from "../../../lib/demo-data";
import CatalogueCarCard from "../../../components/cars/CatalogueCarCard";
import styles from "./CarsCatalogue.module.css";

const PAGE_SIZE = 6;

export default function CarsCatalogue({ cars: initialCars }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read initial filter values from URL or defaults
  const paramSearch = searchParams.get("q") || "";
  const paramLocation = searchParams.get("location") || "All locations";
  const paramTransmission = searchParams.get("transmission") || "All";
  const paramSeats = searchParams.get("seats") || "Any";
  const paramMaxPrice = searchParams.get("maxPrice") || "";
  const paramSort = searchParams.get("sort") || "recommended";
  const paramPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const [cars, setCars] = useState(initialCars || []);
  const [search, setSearch] = useState(paramSearch);
  const [location, setLocation] = useState(paramLocation);
  const [transmission, setTransmission] = useState(paramTransmission);
  const [minSeats, setMinSeats] = useState(paramSeats);
  const [maxPrice, setMaxPrice] = useState(paramMaxPrice);
  const [sort, setSort] = useState(paramSort);
  const [currentPage, setCurrentPage] = useState(paramPage);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const refreshCars = () => setCars(getCars());
    refreshCars();

    window.addEventListener("sheggar-storage-change", refreshCars);
    window.addEventListener("storage", refreshCars);

    return () => {
      window.removeEventListener("sheggar-storage-change", refreshCars);
      window.removeEventListener("storage", refreshCars);
    };
  }, []);

  // Update URL search parameters when filters change
  function updateParams(newFilters, newPage = 1) {
    const params = new URLSearchParams();
    const q = newFilters.search ?? search;
    const loc = newFilters.location ?? location;
    const trans = newFilters.transmission ?? transmission;
    const seats = newFilters.minSeats ?? minSeats;
    const price = newFilters.maxPrice ?? maxPrice;
    const s = newFilters.sort ?? sort;

    if (q) params.set("q", q);
    if (loc && loc !== "All locations") params.set("location", loc);
    if (trans && trans !== "All") params.set("transmission", trans);
    if (seats && seats !== "Any") params.set("seats", seats);
    if (price) params.set("maxPrice", price);
    if (s && s !== "recommended") params.set("sort", s);
    if (newPage > 1) params.set("page", String(newPage));

    const queryString = params.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, { scroll: false });
  }

  // Approved cars only for public catalogue
  const approvedCars = useMemo(() => {
    return cars.filter((car) => {
      const moderation = car.moderationStatus || car.status || "approved";
      return (
        !car.archivedAt &&
        (moderation === "approved" || moderation === "available")
      );
    });
  }, [cars]);

  const locations = useMemo(
    () => [...new Set(approvedCars.map((car) => car.location).filter(Boolean))].sort(),
    [approvedCars]
  );

  const filteredCars = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = approvedCars.filter((car) => {
      const searchableText = `${car.make} ${car.model} ${car.year} ${car.description || ""} ${car.location || ""}`.toLowerCase();

      return (
        searchableText.includes(query) &&
        (location === "All locations" || car.location === location) &&
        (transmission === "All" || car.transmission === transmission) &&
        (minSeats === "Any" || car.seats >= Number(minSeats)) &&
        (maxPrice === "" || car.pricePerDay <= Number(maxPrice))
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
  }, [approvedCars, search, location, transmission, minSeats, maxPrice, sort]);

  // Pagination calculation
  const totalCount = filteredCars.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const paginatedCars = filteredCars.slice(startIndex, startIndex + PAGE_SIZE);

  function handleFilterChange(updates) {
    if ("search" in updates) setSearch(updates.search);
    if ("location" in updates) setLocation(updates.location);
    if ("transmission" in updates) setTransmission(updates.transmission);
    if ("minSeats" in updates) setMinSeats(updates.minSeats);
    if ("maxPrice" in updates) setMaxPrice(updates.maxPrice);
    if ("sort" in updates) setSort(updates.sort);
    setCurrentPage(1);
    updateParams(updates, 1);
  }

  function handlePageChange(newPage) {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    updateParams({}, newPage);
    window.scrollTo({ top: 320, behavior: "smooth" });
  }

  function resetFilters() {
    setSearch("");
    setLocation("All locations");
    setTransmission("All");
    setMinSeats("Any");
    setMaxPrice("");
    setSort("recommended");
    setCurrentPage(1);
    router.replace(pathname, { scroll: false });
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
            <span className={styles.visuallyHidden}>Search cars</span>
            <input
              type="search"
              value={search}
              onChange={(event) =>
                handleFilterChange({ search: event.target.value })
              }
              placeholder="Search make, model, year or location..."
            />
            {search && (
              <button
                type="button"
                className={styles.clearSearch}
                onClick={() => handleFilterChange({ search: "" })}
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
              Showing {totalCount > 0 ? startIndex + 1 : 0}–
              {Math.min(startIndex + PAGE_SIZE, totalCount)} of {totalCount}{" "}
              verified listings
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
                onChange={(event) =>
                  handleFilterChange({ sort: event.target.value })
                }
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
                onChange={(event) =>
                  handleFilterChange({ location: event.target.value })
                }
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
                  handleFilterChange({ transmission: event.target.value })
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
                onChange={(event) =>
                  handleFilterChange({ minSeats: event.target.value })
                }
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
                onChange={(event) =>
                  handleFilterChange({ maxPrice: event.target.value })
                }
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

        {paginatedCars.length > 0 ? (
          <>
            <div className={styles.grid}>
              {paginatedCars.map((car) => (
                <CatalogueCarCard key={car.id} car={car} />
              ))}
            </div>

            {totalPages > 1 && (
              <nav className={styles.pagination} aria-label="Catalogue pagination">
                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => handlePageChange(safeCurrentPage - 1)}
                  disabled={safeCurrentPage <= 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`${styles.pageButton} ${p === safeCurrentPage ? styles.activePage : ""}`}
                    onClick={() => handlePageChange(p)}
                    aria-current={p === safeCurrentPage ? "page" : undefined}
                  >
                    {p}
                  </button>
                ))}

                <button
                  type="button"
                  className={styles.pageButton}
                  onClick={() => handlePageChange(safeCurrentPage + 1)}
                  disabled={safeCurrentPage >= totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
                <span className={styles.pageInfo}>
                  Page {safeCurrentPage} of {totalPages}
                </span>
              </nav>
            )}
          </>
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
