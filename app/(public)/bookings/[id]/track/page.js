import { Suspense } from "react";
import TripTrackingClient from "./TripTrackingClient";

export const instant = false;

export const metadata = {
  title: "Simulated Trip Tracking | Sheggar Wheels",
  description: "Live simulated vehicle GPS route tracking across Addis Ababa.",
};

export default async function TripTrackPage({ params }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center" }}>Loading simulated tracking…</div>}>
      <TripTrackingClient id={id} />
    </Suspense>
  );
}
