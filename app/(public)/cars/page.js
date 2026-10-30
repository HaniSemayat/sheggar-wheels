import { Suspense } from "react";
import { demoCars } from "../../../data/cars";
import CarsCatalogue from "./CarsCatalogue";

export const metadata = {
  title: "Browse Cars | Sheggar Wheels",
  description:
    "Explore demo car listings across Addis Ababa. Compare vehicles, daily prices, seats, and transmission.",
};

export default function CarsPage() {
  return (
    <Suspense fallback={<div style={{ padding: "64px 24px", textAlign: "center" }}>Loading car catalogue…</div>}>
      <CarsCatalogue cars={demoCars} />
    </Suspense>
  );
}
