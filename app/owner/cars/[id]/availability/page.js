import { Suspense } from "react";
import CarAvailabilityClient from "./CarAvailabilityClient";

export const instant = false;

export const metadata = {
  title: "Car Blackout Calendar | Sheggar Wheels",
  description: "Block or unblock dates for vehicle rental availability.",
};

export default async function CarAvailabilityPage({ params }) {
  const { id } = await params;
  return (
    <Suspense fallback={<div style={{ padding: 48, textAlign: "center" }}>Loading availability…</div>}>
      <CarAvailabilityClient id={id} />
    </Suspense>
  );
}
