import { demoCars } from "../data/cars";
import { readStorage, writeStorage, STORAGE_KEYS } from "./storage";

const demoUsers = [
  {
    id: "renter-001",
    name: "Abebe Kebede",
    email: "renter@sheggar.demo",
    password: "demo123",
    role: "renter",
    phone: "+251911000001",
  },
  {
    id: "owner-001",
    name: "Mekdes Tadesse",
    email: "owner@sheggar.demo",
    password: "demo123",
    role: "owner",
    phone: "+251911000002",
  },
  {
    id: "admin-001",
    name: "Sheggar Administrator",
    email: "admin@sheggar.demo",
    password: "demo123",
    role: "admin",
    phone: "+251911000003",
  },
];

const demoBookings = [
  {
    id: "booking-001",
    carId: "toyota-corolla-2022",
    renterId: "renter-001",
    ownerId: "owner-001",
    startDate: "2026-10-10",
    endDate: "2026-10-12",
    totalPrice: 7500,
    status: "completed",
    createdAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "booking-002",
    carId: "hyundai-tucson-2023",
    renterId: "renter-001",
    ownerId: "owner-002",
    startDate: "2026-11-10",
    endDate: "2026-11-12",
    totalPrice: 13500,
    status: "pending",
    createdAt: "2026-10-20T10:00:00.000Z",
  },
  {
    id: "booking-003",
    carId: "kia-picanto-2023",
    renterId: "renter-001",
    ownerId: "owner-003",
    startDate: "2026-11-15",
    endDate: "2026-11-17",
    totalPrice: 5400,
    status: "confirmed",
    createdAt: "2026-10-21T11:00:00.000Z",
  },
  {
    id: "booking-004",
    carId: "toyota-rav4-2022",
    renterId: "renter-001",
    ownerId: "owner-005",
    startDate: "2026-10-05",
    endDate: "2026-10-06",
    totalPrice: 10000,
    status: "cancelled",
    createdAt: "2026-09-25T12:00:00.000Z",
  },
];

const demoReviews = [
  {
    id: "review-001",
    carId: "toyota-corolla-2022",
    renterId: "renter-001",
    bookingId: "booking-001",
    rating: 5,
    comment: "Clean car, smooth pickup, and a comfortable ride.",
    createdAt: "2026-10-13T08:00:00.000Z",
  },
];

export function initializeDemoData() {
  if (typeof window === "undefined") {
    return { initialized: false, reason: "server" };
  }

  const seeds = [
    [STORAGE_KEYS.cars, demoCars],
    [STORAGE_KEYS.users, demoUsers],
    [STORAGE_KEYS.bookings, demoBookings],
    [STORAGE_KEYS.reviews, demoReviews],
  ];

  const initializedKeys = [];

  for (const [key, seed] of seeds) {
    try {
      if (window.localStorage.getItem(key) === null) {
        if (writeStorage(key, seed)) {
          initializedKeys.push(key);
        }
      }
    } catch (error) {
      console.error(`Could not initialize demo data for "${key}":`, error);
    }
  }

  return {
    initialized: true,
    initializedKeys,
  };
}

export function getCars() {
  return readStorage(STORAGE_KEYS.cars, demoCars);
}

export function getUsers() {
  return readStorage(STORAGE_KEYS.users, demoUsers);
}

export function getBookings() {
  return readStorage(STORAGE_KEYS.bookings, demoBookings);
}

export function getReviews() {
  return readStorage(STORAGE_KEYS.reviews, demoReviews);
}
