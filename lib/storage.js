const isBrowser = typeof window !== "undefined";

export const STORAGE_KEYS = {
  cars: "sw_cars_v1",
  users: "sw_users_v1",
  bookings: "sw_bookings_v1",
  reviews: "sw_reviews_v1",
  deletedCars: "sw_deleted_cars_v1",
};

export function readStorage(key, fallback = []) {
  if (!isBrowser) return fallback;

  try {
    const value = window.localStorage.getItem(key);
    if (value === null) return fallback;

    return JSON.parse(value);
  } catch (error) {
    console.error(`Failed to read localStorage key "${key}":`, error);
    return fallback;
  }
}

export function writeStorage(key, value) {
  if (!isBrowser) return false;

  try {
    window.localStorage.setItem(key, JSON.stringify(value));

    window.dispatchEvent(
      new CustomEvent("sheggar-storage-change", {
        detail: { key },
      })
    );

    return true;
  } catch (error) {
    console.error(`Failed to write localStorage key "${key}":`, error);
    return false;
  }
}
