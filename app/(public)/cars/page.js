
import { demoCars } from "../../../data/cars";
import CarsCatalogue from "./CarsCatalogue";

export const metadata = {
  title: "Browse Cars | Sheggar Wheels",
  description:
    "Explore demo car listings across Addis Ababa. Compare vehicles, daily prices, seats, and transmission.",
};

export default function CarsPage() {
  return <CarsCatalogue cars={demoCars} />;
}
