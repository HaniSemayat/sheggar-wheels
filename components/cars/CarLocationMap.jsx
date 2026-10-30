"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const NEIGHBOURHOOD_COORDS = {
  Bole: [9.0054, 38.7885],
  Mexico: [9.0118, 38.7456],
  Kazanchis: [9.0185, 38.7692],
  "Sar Bet": [8.9954, 38.742],
  Piassa: [9.035, 38.752],
  CMC: [9.021, 38.834],
  Gerji: [8.992, 38.812],
  Megenagna: [9.0215, 38.801],
  Ayat: [9.034, 38.854],
  "Old Airport": [8.985, 38.745],
};

export default function CarLocationMap({ location, title, latitude, longitude }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const defaultCoords = NEIGHBOURHOOD_COORDS[location] || [9.0054, 38.7885];
      const lat = Number(latitude) || defaultCoords[0];
      const lng = Number(longitude) || defaultCoords[1];

      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: false,
      }).setView([lat, lng], 14);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      const customIcon = L.divIcon({
        className: "sheggar-map-marker",
        html: `<div style="
          background: #d97706;
          color: white;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.35);
          border: 2px solid white;
          font-weight: bold;
          font-size: 14px;
        ">🚗</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        popupAnchor: [0, -18],
      });

      L.marker([lat, lng], { icon: customIcon })
        .addTo(map)
        .bindPopup(
          `<b>${title || "Vehicle Pickup Point"}</b><br/>${location || "Addis Ababa"}, Ethiopia`
        )
        .openPopup();

      mapInstanceRef.current = map;
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [location, title, latitude, longitude]);

  return (
    <div
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid var(--color-border, #e5e7eb)",
        marginTop: "16px",
      }}
    >
      <div
        ref={mapContainerRef}
        style={{ width: "100%", height: "260px", zIndex: 1 }}
        aria-label={`Interactive map showing pickup location in ${location}`}
      />
    </div>
  );
}
