"use client";

import { startTransition, useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Navigation, Play, Pause, RotateCcw, CheckCircle2 } from "lucide-react";
import { getBookings, getCars } from "../../../../../lib/demo-data";
import { STORAGE_KEYS, writeStorage } from "../../../../../lib/storage";
import "leaflet/dist/leaflet.css";

// Waypoints across Addis Ababa: Bole -> Meskel Square -> Kazanchis -> Arat Kilo
const ROUTE_POINTS = [
  { lat: 9.0054, lng: 38.7885, name: "Bole Medhanialem (Pickup Point)" },
  { lat: 9.0080, lng: 38.7750, name: "Bole Road (Africa Avenue)" },
  { lat: 9.0118, lng: 38.7620, name: "Meskel Square Junction" },
  { lat: 9.0185, lng: 38.7692, name: "Kazanchis Commercial District" },
  { lat: 9.0250, lng: 38.7630, name: "Arat Kilo / National Palace" },
];

export default function TripTrackingClient({ id }) {
  const [booking, setBooking] = useState(null);
  const [car, setCar] = useState(null);
  const [ready, setReady] = useState(false);
  const [pointIndex, setPointIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [tripCompleted, setTripCompleted] = useState(false);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    startTransition(() => {
      const foundBooking = getBookings().find((b) => b.id === id);

      if (foundBooking) {
        setBooking(foundBooking);
        const foundCar = getCars().find((c) => c.id === foundBooking.carId);
        setCar(foundCar || null);
      }

      setReady(true);
    });
  }, [id]);

  // Leaflet map initialization
  useEffect(() => {
    let isMounted = true;
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (!mapRef.current) {
        const map = L.map(mapContainerRef.current, {
          scrollWheelZoom: false,
        }).setView([ROUTE_POINTS[0].lat, ROUTE_POINTS[0].lng], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map);

        // Draw planned route polyline
        const coords = ROUTE_POINTS.map((p) => [p.lat, p.lng]);
        L.polyline(coords, { color: "#0066ff", weight: 4, dashArray: "6, 8" }).addTo(map);

        // Pickup marker
        L.marker(coords[0])
          .addTo(map)
          .bindPopup("<b>Pickup:</b> " + ROUTE_POINTS[0].name);

        // Destination marker
        L.marker(coords[coords.length - 1])
          .addTo(map)
          .bindPopup("<b>Destination:</b> " + ROUTE_POINTS[coords.length - 1].name);

        // Moving vehicle marker
        const carIcon = L.divIcon({
          className: "trip-car-marker",
          html: `<div style="
            background: #16a34a;
            color: white;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            border: 3px solid white;
            font-size: 18px;
            transform: scale(1.1);
          ">🚘</div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
        });

        const marker = L.marker(coords[0], { icon: carIcon }).addTo(map);
        markerRef.current = marker;
        mapRef.current = map;
      }
    });

    return () => {
      isMounted = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Moving marker loop
  useEffect(() => {
    if (!isPlaying || tripCompleted) return;

    const interval = setInterval(() => {
      setPointIndex((prev) => {
        const next = prev + 1;
        if (next >= ROUTE_POINTS.length) {
          setIsPlaying(false);
          setTripCompleted(true);
          return prev;
        }
        return next;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isPlaying, tripCompleted]);

  // Update marker position on map
  useEffect(() => {
    if (markerRef.current && mapRef.current) {
      const currentPt = ROUTE_POINTS[pointIndex];
      markerRef.current.setLatLng([currentPt.lat, currentPt.lng]);
      mapRef.current.panTo([currentPt.lat, currentPt.lng]);
    }
  }, [pointIndex]);

  function handleCompleteTrip() {
    if (!booking) return;
    const allBookings = getBookings();
    const updated = allBookings.map((b) =>
      b.id === booking.id ? { ...b, status: "completed" } : b
    );
    writeStorage(STORAGE_KEYS.bookings, updated);
    setBooking((prev) => ({ ...prev, status: "completed" }));
    setTripCompleted(true);
  }

  function handleReset() {
    setPointIndex(0);
    setTripCompleted(false);
    setIsPlaying(true);
  }

  if (!ready) {
    return (
      <div style={{ padding: "64px", textAlign: "center" }}>
        Loading simulated GPS telemetry…
      </div>
    );
  }

  const currentWaypoint = ROUTE_POINTS[pointIndex];

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "36px 20px" }}>
      <Link
        href={booking ? `/bookings/${booking.id}` : "/my-bookings"}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--color-brand, #0066ff)",
          textDecoration: "none",
          fontWeight: 600,
          marginBottom: "20px",
        }}
      >
        <ArrowLeft size={16} /> Back to booking details
      </Link>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span
            style={{
              background: "#fef3c7",
              color: "#92400e",
              padding: "4px 10px",
              borderRadius: "999px",
              fontWeight: 800,
              fontSize: "12px",
              letterSpacing: "0.08em",
            }}
          >
            SIMULATION MODE
          </span>
          <h1 style={{ fontSize: "28px", margin: "10px 0 6px" }}>
            Real-Time Trip Tracking
          </h1>
          <p style={{ color: "var(--color-text-muted, #6b7280)", margin: 0 }}>
            {car ? `${car.year} ${car.make} ${car.model}` : "Vehicle"} · Booking Ref:{" "}
            {booking?.id || id}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid var(--color-border, #d1d5db)",
              background: "var(--color-surface, #fff)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            {isPlaying ? "Pause" : "Resume"}
          </button>

          <button
            type="button"
            onClick={handleReset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "10px 16px",
              borderRadius: "8px",
              border: "1px solid var(--color-border, #d1d5db)",
              background: "var(--color-surface, #fff)",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={16} />
            Reset
          </button>

          {!tripCompleted && (
            <button
              type="button"
              onClick={handleCompleteTrip}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "10px 16px",
                borderRadius: "8px",
                border: "none",
                background: "#16a34a",
                color: "white",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <CheckCircle2 size={16} />
              Simulate Return & Complete
            </button>
          )}
        </div>
      </div>

      {/* Telemetry Status Bar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          background: "var(--color-surface, #fff)",
          border: "1px solid var(--color-border, #e5e7eb)",
          borderRadius: "12px",
          padding: "18px 24px",
          marginBottom: "20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
        }}
      >
        <div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted, #6b7280)", textTransform: "uppercase", fontWeight: 700 }}>
            Current Location
          </span>
          <strong style={{ display: "block", fontSize: "15px", marginTop: "4px" }}>
            {currentWaypoint.name}
          </strong>
        </div>

        <div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted, #6b7280)", textTransform: "uppercase", fontWeight: 700 }}>
            Simulated Speed
          </span>
          <strong style={{ display: "block", fontSize: "15px", marginTop: "4px", color: "#16a34a" }}>
            {isPlaying && !tripCompleted ? "38 km/h" : "0 km/h (Stopped)"}
          </strong>
        </div>

        <div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted, #6b7280)", textTransform: "uppercase", fontWeight: 700 }}>
            GPS Status
          </span>
          <strong style={{ display: "block", fontSize: "15px", marginTop: "4px", color: "#0066ff" }}>
            🛰 Active Telemetry
          </strong>
        </div>

        <div>
          <span style={{ fontSize: "12px", color: "var(--color-text-muted, #6b7280)", textTransform: "uppercase", fontWeight: 700 }}>
            Trip Progress
          </span>
          <strong style={{ display: "block", fontSize: "15px", marginTop: "4px" }}>
            Leg {pointIndex + 1} of {ROUTE_POINTS.length}
          </strong>
        </div>
      </div>

      {tripCompleted && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            color: "#166534",
            padding: "16px 20px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div>
            <strong>Trip Simulation Finished!</strong>
            <p style={{ margin: "4px 0 0", fontSize: "14px" }}>
              The vehicle has reached its destination and the rental can now be reviewed.
            </p>
          </div>
          <Link
            href={`/bookings/${id}/review`}
            style={{
              background: "#16a34a",
              color: "white",
              padding: "10px 18px",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Leave Review →
          </Link>
        </div>
      )}

      {/* Map Container */}
      <div
        style={{
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--color-border, #e5e7eb)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
        }}
      >
        <div
          ref={mapContainerRef}
          style={{ width: "100%", height: "460px", zIndex: 1 }}
          aria-label="Interactive map displaying simulated trip route in Addis Ababa"
        />
      </div>

      <p style={{ fontSize: "12px", color: "var(--color-text-muted, #6b7280)", textAlign: "center", marginTop: "16px" }}>
        Simulated telemetry for Addis Ababa, Ethiopia · OpenStreetMap contributors
      </p>
    </div>
  );
}
